import { auth, db, doc, setDoc, collection, getDocs, query, limit } from './firebase';

export interface DiagnosticResult {
  timestamp: string;
  projectId: string;
  authStatus: {
    isAuthenticated: boolean;
    uid?: string;
    email?: string;
  };
  readTest: {
    success: boolean;
    durationMs: number;
    docCount?: number;
    error?: {
      code: string;
      message: string;
      details?: string;
    };
  };
  writeTest: {
    success: boolean;
    durationMs: number;
    docId?: string;
    error?: {
      code: string;
      message: string;
      details?: string;
    };
  };
  summary: string;
}

export async function checkFirestorePermissions(): Promise<DiagnosticResult> {
  const currentUser = auth.currentUser;
  const projectId = db.app.options.projectId || 'vaultix-income-production';

  console.group('🔥 [FIRESTORE DIAGNOSTIC TOOL] Running Read/Write Security Audit...');
  console.info(`📌 Target Firebase Project ID: ${projectId}`);
  console.info(`👤 Auth State: ${currentUser ? `AUTHENTICATED (UID: ${currentUser.uid}, Email: ${currentUser.email || 'N/A'})` : 'UNAUTHENTICATED / ANONYMOUS'}`);

  const result: DiagnosticResult = {
    timestamp: new Date().toISOString(),
    projectId,
    authStatus: {
      isAuthenticated: Boolean(currentUser),
      uid: currentUser?.uid,
      email: currentUser?.email || undefined
    },
    readTest: { success: false, durationMs: 0 },
    writeTest: { success: false, durationMs: 0 },
    summary: ''
  };

  // 1. TEST READ PERMISSIONS ON 'users' COLLECTION
  const readStart = Date.now();
  try {
    const q = query(collection(db, 'users'), limit(5));
    const snap = await getDocs(q);
    result.readTest.durationMs = Date.now() - readStart;
    result.readTest.success = true;
    result.readTest.docCount = snap.size;

    console.log(`✅ [READ TEST PASSED] Successfully queried 'users' collection (${snap.size} document(s) returned in ${result.readTest.durationMs}ms)`);
  } catch (err: any) {
    result.readTest.durationMs = Date.now() - readStart;
    result.readTest.success = false;
    const errorCode = err.code || 'read_failed';
    const errorMsg = err.message || String(err);

    let details = 'Unknown Firestore read error.';
    if (errorCode === 'permission-denied') {
      details = 'SECURITY RULE VIOLATION (permission-denied): The current auth token or request parameters violate Firestore security rules for reading the `users` collection.';
    } else if (errorCode === 'unauthenticated') {
      details = 'UNAUTHENTICATED (unauthenticated): Operation requires an authenticated Firebase Auth session.';
    } else if (errorCode === 'unavailable') {
      details = 'UNAVAILABLE (unavailable): Could not reach Firestore backend or network offline.';
    }

    result.readTest.error = { code: errorCode, message: errorMsg, details };
    console.error(`❌ [READ TEST FAILED] (${result.readTest.durationMs}ms) Code: ${errorCode} - ${errorMsg}`);
    console.error(`🔍 Details: ${details}`);
  }

  // 2. TEST WRITE PERMISSIONS ON ISOLATED '_diagnostics' COLLECTION
  const writeStart = Date.now();
  const testUid = currentUser?.uid || `diag-test-${Date.now()}`;
  const testDocRef = doc(db, '_diagnostics', `ping_${testUid}`);

  try {
    const pingData = {
      diagnosticPingAt: new Date().toISOString(),
      diagnosticAppVersion: 'v13.0',
      uid: testUid
    };

    await setDoc(testDocRef, pingData, { merge: true });
    result.writeTest.durationMs = Date.now() - writeStart;
    result.writeTest.success = true;
    result.writeTest.docId = `_diagnostics/ping_${testUid}`;

    console.log(`✅ [WRITE TEST PASSED] Successfully wrote isolated ping to '_diagnostics/ping_${testUid}' in ${result.writeTest.durationMs}ms`);
  } catch (err: any) {
    result.writeTest.durationMs = Date.now() - writeStart;
    result.writeTest.success = false;
    const errorCode = err.code || 'write_failed';
    const errorMsg = err.message || String(err);

    let details = 'Unknown Firestore write error.';
    if (errorCode === 'permission-denied') {
      details = 'SECURITY RULE VIOLATION (permission-denied): Write operation to isolated diagnostic document was rejected by Firestore security rules.';
    } else if (errorCode === 'unauthenticated') {
      details = 'UNAUTHENTICATED (unauthenticated): Writing requires an authenticated Firebase user session.';
    } else if (errorCode === 'invalid-argument') {
      details = 'INVALID ARGUMENT: Provided document data format is invalid for Firestore.';
    }

    result.writeTest.error = { code: errorCode, message: errorMsg, details };
    console.error(`❌ [WRITE TEST FAILED] (${result.writeTest.durationMs}ms) Code: ${errorCode} - ${errorMsg}`);
    console.error(`🔍 Details: ${details}`);
  }

  // SUMMARY AUDIT REPORT
  if (result.readTest.success && result.writeTest.success) {
    result.summary = 'ALL FIRESTORE PERMISSIONS VERIFIED (READ: PASS, WRITE: PASS)';
    console.log(`🎉 [DIAGNOSTIC SUMMARY] ${result.summary}`);
  } else {
    result.summary = `PERMISSIONS CHECK INCOMPLETE: Read = ${result.readTest.success ? 'PASS' : 'FAIL'}, Write = ${result.writeTest.success ? 'PASS' : 'FAIL'}`;
    console.warn(`⚠️ [DIAGNOSTIC SUMMARY] ${result.summary}`);
  }

  console.groupEnd();
  return result;
}

// Expose on global window object for developer browser console invocation
if (typeof window !== 'undefined') {
  (window as any).runFirestoreDiagnostics = checkFirestorePermissions;
}
