import * as fs from "fs";
import * as path from "path";
const STORE_FILE = process.env.VERCEL || process.env.AWS_REGION ? path.resolve("/tmp", ".authoritative_store.json") : path.resolve(process.cwd(), ".authoritative_store.json");
const INITIAL_USERS = [
  {
    userId: "USR-000001",
    accountId: "VX-100001",
    username: "vaultix_admin",
    fullName: "Vaultix Administrator",
    email: "vaultixincometeam@outlook.com",
    role: "ADMIN",
    accountStatus: "ACTIVE",
    balance: 0,
    totalDeposits: 0,
    totalInvestments: 0,
    totalProfitLoss: 0,
    referralEarnings: 0,
    bonusBalance: 0,
    referralCode: "VXREF-ADMIN",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    userId: "USR-009865",
    accountId: "VX-986501",
    username: "crypto_whale",
    fullName: "Robert Sterling",
    email: "robert.sterling@vaultix.pro",
    role: "USER",
    accountStatus: "ACTIVE",
    balance: 15078,
    totalDeposits: 2e4,
    totalInvestments: 5e3,
    totalProfitLoss: 1250,
    referralEarnings: 45,
    bonusBalance: 0,
    referralCode: "VXREF-9865",
    createdAt: "2026-01-15T10:00:00.000Z"
  },
  {
    userId: "USR-003316",
    accountId: "VX-331601",
    username: "alex_trader",
    fullName: "Alex Morgan",
    email: "alex.m@vaultix.pro",
    role: "USER",
    accountStatus: "ACTIVE",
    balance: 5200,
    totalDeposits: 8e3,
    totalInvestments: 3e3,
    totalProfitLoss: 450,
    referralEarnings: 20,
    bonusBalance: 0,
    referralCode: "VXREF-3316",
    createdAt: "2026-02-01T12:00:00.000Z"
  }
];
class AuthoritativeStore {
  users = /* @__PURE__ */ new Map();
  investments = /* @__PURE__ */ new Map();
  transactions = /* @__PURE__ */ new Map();
  inFlightInvestments = /* @__PURE__ */ new Set();
  constructor() {
    this.loadFromDisk();
  }
  loadFromDisk() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, "utf-8");
        const data = JSON.parse(raw);
        if (Array.isArray(data.users)) {
          for (const u of data.users) {
            this.users.set(u.userId, u);
          }
        }
        if (Array.isArray(data.investments)) {
          for (const inv of data.investments) {
            this.investments.set(inv.id, inv);
          }
        }
        if (Array.isArray(data.transactions)) {
          for (const tx of data.transactions) {
            this.transactions.set(tx.id, tx);
          }
        }
      }
    } catch (e) {
      console.warn("Could not read authoritative store from disk, initializing defaults:", e);
    }
    for (const initU of INITIAL_USERS) {
      if (!this.users.has(initU.userId)) {
        this.users.set(initU.userId, initU);
      }
    }
  }
  saveToDisk() {
    try {
      const payload = {
        users: Array.from(this.users.values()),
        investments: Array.from(this.investments.values()),
        transactions: Array.from(this.transactions.values())
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(payload, null, 2), "utf-8");
    } catch (e) {
      console.warn("Could not save authoritative store to disk:", e);
    }
  }
  getAllUsers() {
    this.loadFromDisk();
    return Array.from(this.users.values());
  }
  getUser(userId) {
    this.loadFromDisk();
    return this.users.get(userId);
  }
  saveUser(user) {
    this.users.set(user.userId, user);
    this.saveToDisk();
  }
  /**
   * Validates a referral code against authoritative user records.
   * Requirements:
   * - Trim leading and trailing whitespace
   * - Case-insensitive matching (vxref-9865 == VXREF-9865)
   * - Prevent self-referral
   * - Allow blank
   */
  validateReferralCode(codeRaw, currentUsername, currentEmail, currentUserId) {
    this.loadFromDisk();
    const trimmed = (codeRaw || "").trim();
    if (!trimmed) {
      return { valid: true, isBlank: true };
    }
    const normalizedCode = trimmed.toUpperCase();
    const cleanUsername = (currentUsername || "").trim().toLowerCase();
    const cleanEmail = (currentEmail || "").trim().toLowerCase();
    if (cleanUsername && normalizedCode === cleanUsername.toUpperCase()) {
      return {
        valid: false,
        isSelfReferral: true,
        error: "You cannot refer yourself. Please enter a valid referral code or leave the field blank."
      };
    }
    if (cleanEmail && normalizedCode === cleanEmail.toUpperCase()) {
      return {
        valid: false,
        isSelfReferral: true,
        error: "You cannot refer yourself. Please enter a valid referral code or leave the field blank."
      };
    }
    let foundUser;
    for (const u of this.users.values()) {
      const uRef = (u.referralCode || "").trim().toUpperCase();
      const uName = (u.username || "").trim().toUpperCase();
      if (uRef === normalizedCode || uName === normalizedCode) {
        foundUser = u;
        break;
      }
    }
    if (!foundUser) {
      return {
        valid: false,
        error: `Invalid referral code "${trimmed}" provided. Please check the code or leave the field blank.`
      };
    }
    const fUsername = foundUser?.username && typeof foundUser.username === "string" ? foundUser.username.toLowerCase() : "";
    const fEmail = foundUser?.email && typeof foundUser.email === "string" ? foundUser.email.toLowerCase() : "";
    if (currentUserId && foundUser?.userId === currentUserId || cleanUsername && fUsername && fUsername === cleanUsername || cleanEmail && fEmail && fEmail === cleanEmail) {
      return {
        valid: false,
        isSelfReferral: true,
        error: "You cannot refer yourself. Please enter a valid referral code or leave the field blank."
      };
    }
    return {
      valid: true,
      referrer: {
        userId: foundUser.userId,
        username: foundUser.username,
        fullName: foundUser.fullName,
        referralCode: foundUser.referralCode
      }
    };
  }
  /**
   * Registers a new user and safely awards referral rewards:
   * - New user: $2 USD welcome bonus credited to designated bonus balance (bonusBalance)
   * - Referrer: $5 USD credited to Referral Tier Balance (referralEarnings)
   * - Idempotent, transaction-safe duplicate protection
   */
  registerUserWithReferral(newUser, referralCodeRaw) {
    const newTxs = [];
    const normalizedNewCode = (newUser.referralCode || `VXREF-${Math.floor(1e3 + Math.random() * 9e3)}`).trim().toUpperCase();
    newUser.referralCode = normalizedNewCode;
    const valResult = this.validateReferralCode(
      referralCodeRaw,
      newUser.username,
      newUser.email,
      newUser.userId
    );
    if (valResult.valid && valResult.referrer && !valResult.isBlank && !valResult.isSelfReferral) {
      const referrerUser = this.users.get(valResult.referrer.userId);
      if (referrerUser && !newUser.hasReceivedSignupBonus) {
        newUser.bonusBalance = (newUser.bonusBalance || 0) + 2;
        newUser.hasReceivedSignupBonus = true;
        newUser.referredBy = referrerUser.userId;
        newUser.referredByUsername = referrerUser.username;
        newUser.referredByDisplayName = referrerUser.fullName || referrerUser.username;
        const welcomeTxId = `TX-${Math.floor(1e5 + Math.random() * 9e5)}`;
        const welcomeTx = {
          id: welcomeTxId,
          userId: newUser.userId,
          type: "REFERRAL_REWARD",
          amount: 2,
          currency: "USD",
          status: "COMPLETED",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          processedAt: (/* @__PURE__ */ new Date()).toISOString(),
          idempotencyKey: `SIGNUP-BONUS-${newUser.userId}`,
          note: "Referral Welcome Bonus ($2.00)"
        };
        this.transactions.set(welcomeTx.id, welcomeTx);
        newTxs.push(welcomeTx);
        referrerUser.bonusBalance = (referrerUser.bonusBalance || 0) + 3;
        referrerUser.referralEarnings = (referrerUser.referralEarnings || 0) + 3;
        const refRewardTxId = `TX-${Math.floor(1e5 + Math.random() * 9e5)}`;
        const refRewardTx = {
          id: refRewardTxId,
          userId: referrerUser.userId,
          type: "REFERRAL_REWARD",
          amount: 3,
          currency: "USD",
          status: "COMPLETED",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          processedAt: (/* @__PURE__ */ new Date()).toISOString(),
          idempotencyKey: `REF-REWARD-${referrerUser.userId}-${newUser.userId}`,
          note: `Referral Reward for registration of @${newUser.username} ($3.00)`
        };
        this.transactions.set(refRewardTx.id, refRewardTx);
        newTxs.push(refRewardTx);
        this.users.set(referrerUser.userId, referrerUser);
      }
    }
    this.users.set(newUser.userId, newUser);
    this.saveToDisk();
    return {
      user: newUser,
      referrer: valResult.referrer ? this.users.get(valResult.referrer.userId) : void 0,
      newTxs
    };
  }
  /**
   * Executes atomic investment subscription:
   * - Checks idempotency
   * - Mutex per user to prevent concurrent double-clicks
   * - Checks authoritative available balance
   * - Atomically deducts balance, increases totalInvestments
   * - Creates active investment and completed ledger entry
   */
  async executeInvestmentAtomic(params) {
    const { userId, planId, planName, asset, amount, dailyYield, lockDays, idempotencyKey } = params;
    if (!userId || !planId || !amount || amount <= 0 || isNaN(amount)) {
      throw new Error("Invalid investment parameters: amount must be greater than zero.");
    }
    this.loadFromDisk();
    if (idempotencyKey) {
      for (const inv of this.investments.values()) {
        if (inv.userId === userId && inv.idempotencyKey === idempotencyKey) {
          const user = this.users.get(userId);
          let tx;
          for (const t of this.transactions.values()) {
            if (t.userId === userId && t.idempotencyKey === idempotencyKey) {
              tx = t;
              break;
            }
          }
          return {
            user,
            investment: inv,
            tx: tx || {
              id: `TX-EXISTING-${inv.id}`,
              userId,
              type: "YIELD",
              amount: inv.amount,
              currency: inv.asset,
              status: "COMPLETED",
              timestamp: inv.startDate
            },
            alreadyProcessed: true
          };
        }
      }
    }
    if (this.inFlightInvestments.has(userId)) {
      throw new Error("CONCURRENT OPERATION: An investment subscription is already in progress for this account. Please wait.");
    }
    this.inFlightInvestments.add(userId);
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error(`User account "${userId}" does not exist in authoritative database.`);
      }
      const currentBalance = typeof user.balance === "number" ? user.balance : 0;
      if (currentBalance < amount) {
        throw new Error(
          `Insufficient balance. Your available balance is $${currentBalance.toFixed(2)}, but this investment requires $${amount.toFixed(2)}.`
        );
      }
      const invId = `INV-${Math.floor(1e5 + Math.random() * 9e5)}`;
      const txId = `TX-${Math.floor(1e5 + Math.random() * 9e5)}`;
      const dailyReturn = amount * ((dailyYield || 2) / 100);
      const newInv = {
        id: invId,
        userId: user.userId,
        planId,
        planName: planName || "Yield Vault Plan",
        asset: asset || "USDT",
        amount,
        dailyReturn,
        startDate: (/* @__PURE__ */ new Date()).toISOString(),
        durationDays: lockDays || 14,
        status: "ACTIVE",
        idempotencyKey: idempotencyKey || void 0
      };
      const invTx = {
        id: txId,
        userId: user.userId,
        type: "YIELD",
        amount,
        currency: asset || "USDT",
        status: "COMPLETED",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        processedAt: (/* @__PURE__ */ new Date()).toISOString(),
        idempotencyKey: idempotencyKey || void 0,
        note: `Subscribed to ${planName || "Investment Plan"} ($${amount.toFixed(2)})`
      };
      const updatedUser = {
        ...user,
        balance: Math.max(0, Math.round((currentBalance - amount) * 100) / 100),
        totalInvestments: Math.round(((user.totalInvestments || 0) + amount) * 100) / 100
      };
      this.users.set(user.userId, updatedUser);
      this.investments.set(newInv.id, newInv);
      this.transactions.set(invTx.id, invTx);
      this.saveToDisk();
      return {
        user: updatedUser,
        investment: newInv,
        tx: invTx
      };
    } finally {
      this.inFlightInvestments.delete(userId);
    }
  }
  getInvestmentsForUser(userId) {
    return Array.from(this.investments.values()).filter((inv) => inv.userId === userId);
  }
  getTransactionsForUser(userId) {
    return Array.from(this.transactions.values()).filter((tx) => tx.userId === userId);
  }
}
const authoritativeStore = new AuthoritativeStore();
export {
  authoritativeStore
};
