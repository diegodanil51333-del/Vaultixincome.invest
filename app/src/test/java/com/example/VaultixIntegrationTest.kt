package com.example

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.example.data.db.VaultixDatabase
import com.example.data.repository.VaultixRepository
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class VaultixIntegrationTest {

    private lateinit var db: VaultixDatabase
    private lateinit var repository: VaultixRepository

    @Before
    fun createDb() = runBlocking {
        val context = ApplicationProvider.getApplicationContext<Context>()
        db = Room.inMemoryDatabaseBuilder(context, VaultixDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        repository = VaultixRepository(db)
        VaultixDatabase.seedDatabase(db)
    }

    @After
    fun closeDb() {
        db.close()
    }

    @Test
    fun testCompleteUserFlowAndAdminSearch() = runBlocking {
        // 1. Register TEST ACCOUNT A
        val regAResult = repository.registerUser(
            usernameInput = "test_acc_a",
            fullNameInput = "Alexander Vault",
            emailInput = "test_acc_a@vaultix.com",
            passwordInput = "password123",
            passwordConfirmInput = "password123",
            referralCodeInput = null
        )

        assertTrue("Account A registration should succeed", regAResult.isSuccess)
        val userA = regAResult.getOrThrow()
        assertEquals("test_acc_a", userA.username)
        assertNotNull(userA.userId)
        assertNotNull(userA.accountId)
        assertNotNull(userA.referralCode)

        // 2. Register TEST ACCOUNT B using Account A's referral code
        val regBResult = repository.registerUser(
            usernameInput = "test_acc_b",
            fullNameInput = "Sophia Investor",
            emailInput = "test_acc_b@vaultix.com",
            passwordInput = "password123",
            passwordConfirmInput = "password123",
            referralCodeInput = userA.referralCode
        )

        assertTrue("Account B registration should succeed", regBResult.isSuccess)
        val userB = regBResult.getOrThrow()
        assertEquals("test_acc_b", userB.username)
        assertEquals("test_acc_a", userB.referredByUsername)

        // 3. Verify Account A's referral list contains Account B
        val referralsForA = repository.getReferredUsersForUsername("test_acc_a").first()
        assertEquals(1, referralsForA.size)
        assertEquals("test_acc_b", referralsForA[0].username)

        // 4. Duplicate Username Prevention
        val dupResult = repository.registerUser(
            usernameInput = "test_acc_a",
            fullNameInput = "Duplicate User",
            emailInput = "another@vaultix.com",
            passwordInput = "password123",
            passwordConfirmInput = "password123"
        )
        assertTrue("Duplicate username registration must fail", dupResult.isFailure)

        // 5. Self-Invitation Prevention
        val selfInviteResult = repository.inviteUserByUsername("test_acc_a", "test_acc_a")
        assertTrue("Self invitation must fail", selfInviteResult.isFailure)

        // 6. Non-existent User Invitation Prevention
        val ghostInviteResult = repository.inviteUserByUsername("test_acc_a", "nonexistent_user")
        assertTrue("Inviting non-existent user must fail", ghostInviteResult.isFailure)

        // 7. Admin User Search Verification
        val searchByUsername = repository.searchUsers("test_acc_a").first()
        assertEquals(1, searchByUsername.size)
        assertEquals("test_acc_a", searchByUsername[0].username)

        val searchByEmail = repository.searchUsers("test_acc_a@vaultix.com").first()
        assertEquals(1, searchByEmail.size)
        assertEquals("test_acc_a", searchByEmail[0].username)

        val searchByAccountId = repository.searchUsers(userA.accountId).first()
        assertEquals(1, searchByAccountId.size)
        assertEquals("test_acc_a", searchByAccountId[0].username)

        val searchPartial = repository.searchUsers("test_acc").first()
        assertEquals(2, searchPartial.size)

        // 8. Authorized Admin Login & Financial Adjustment
        val adminLoginRes = repository.loginUser("Vaultixincometeam@outlook.com", "VaultixAdmin2026!Secured")
        assertTrue("Admin login with Vaultixincometeam@outlook.com must succeed", adminLoginRes.isSuccess)
        val adminUser = adminLoginRes.getOrThrow()
        assertEquals("ADMIN", adminUser.role)

        val adjustResult = repository.adminAdjustBalance(adminUser.username, "test_acc_a", 500.0, "Test Bonus")
        assertTrue("Admin balance adjust should succeed", adjustResult.isSuccess)

        val updatedA = repository.getUserByUsername("test_acc_a")
        assertNotNull(updatedA)
        // Initial 1000 + $25 referral reward for inviting test_acc_b + $500 admin credit = $1525
        assertEquals(1525.0, updatedA!!.balance, 0.01)
    }
}
