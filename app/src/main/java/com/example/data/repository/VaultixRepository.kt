package com.example.data.repository

import com.example.data.db.AuditLogEntity
import com.example.data.db.InvitationEntity
import com.example.data.db.InvestmentEntity
import com.example.data.db.TransactionEntity
import com.example.data.db.UserEntity
import com.example.data.db.VaultixDatabase
import kotlinx.coroutines.flow.Flow
import java.util.Locale
import java.util.UUID

class VaultixRepository(private val db: VaultixDatabase) {

    private val userDao = db.userDao()
    private val invitationDao = db.invitationDao()
    private val transactionDao = db.transactionDao()
    private val investmentDao = db.investmentDao()
    private val auditLogDao = db.auditLogDao()

    // ----------------------------------------------------
    // AUTHENTICATION & REGISTRATION
    // ----------------------------------------------------

    suspend fun registerUser(
        usernameInput: String,
        fullNameInput: String,
        emailInput: String,
        passwordInput: String,
        passwordConfirmInput: String,
        referralCodeInput: String? = null
    ): Result<UserEntity> {
        val username = usernameInput.trim()
        val fullName = fullNameInput.trim()
        val email = emailInput.trim().lowercase(Locale.ROOT)
        val password = passwordInput.trim()
        val passwordConfirm = passwordConfirmInput.trim()

        // 1. Validation Rules
        if (username.length < 3) {
            return Result.failure(IllegalArgumentException("Username must be at least 3 characters."))
        }
        if (!username.matches(Regex("^[a-zA-Z0-9_]+$"))) {
            return Result.failure(IllegalArgumentException("Username can only contain letters, numbers, and underscores."))
        }
        if (email.isEmpty() || !email.contains("@")) {
            return Result.failure(IllegalArgumentException("Please enter a valid email address."))
        }
        if (password.length < 6) {
            return Result.failure(IllegalArgumentException("Password must be at least 6 characters."))
        }
        if (password != passwordConfirm) {
            return Result.failure(IllegalArgumentException("Passwords do not match."))
        }

        // 2. Server-side / DAO uniqueness check for Duplicate Username
        val existingUsername = userDao.getUserByUsername(username)
        if (existingUsername != null) {
            return Result.failure(IllegalStateException("Username '$username' is already taken. Please choose another."))
        }

        // 3. Server-side / DAO uniqueness check for Duplicate Email
        val existingEmail = userDao.getUserByEmail(email)
        if (existingEmail != null) {
            return Result.failure(IllegalStateException("An account with email '$email' already exists."))
        }

        // 4. Resolve Referrer if code/link or username is provided
        var referrerUsername: String? = null
        if (!referralCodeInput.isNullOrBlank()) {
            val codeClean = referralCodeInput.trim()
            // Check if code matches a user's referralCode or exact username
            val userByCode = userDao.getUserByReferralCode(codeClean) 
                ?: userDao.getUserByUsername(codeClean)
            
            if (userByCode != null) {
                if (userByCode.username.equals(username, ignoreCase = true)) {
                    return Result.failure(IllegalArgumentException("Self-referrals are not permitted."))
                }
                referrerUsername = userByCode.username
            }
        }

        // 5. Generate Unique IDs
        val randomNum = (100000..999999).random()
        val userId = "USR-$randomNum"
        val accountId = "VX-${(100000..999999).random()}"
        val refCode = "VXREF-" + UUID.randomUUID().toString().take(4).uppercase(Locale.ROOT)

        val signupBonus = if (referrerUsername != null) 5.0 else 0.0

        val newUser = UserEntity(
            userId = userId,
            accountId = accountId,
            username = username,
            fullName = fullName.ifEmpty { username },
            email = email,
            passwordHash = password,
            role = "USER",
            accountStatus = "ACTIVE",
            registrationDate = System.currentTimeMillis(),
            lastLogin = System.currentTimeMillis(),
            balance = signupBonus, // $0.00 default starting balance ($5.00 if invited with code)
            totalDeposits = 0.0,
            referralCode = refCode,
            referredByUsername = referrerUsername
        )

        val insertedId = userDao.insertUser(newUser)
        val createdUser = newUser.copy(id = insertedId)

        // 6. Update pending invitations or referral relationships if invited
        if (referrerUsername != null) {
            val referrerUser = userDao.getUserByUsername(referrerUsername)
            if (referrerUser != null) {
                // Award referral bonus to inviter
                val bonus = 25.0
                val updatedReferrer = referrerUser.copy(
                    balance = referrerUser.balance + bonus
                )
                userDao.updateUser(updatedReferrer)

                // Record referral transaction for inviter
                transactionDao.insertTransaction(
                    TransactionEntity(
                        transactionId = "TXN-REF-${System.currentTimeMillis()}",
                        userId = referrerUser.userId,
                        username = referrerUser.username,
                        type = "REFERRAL_REWARD",
                        amount = bonus,
                        description = "Referral Bonus for registering user @$username"
                    )
                )

                // Create or update invitation record
                invitationDao.insertInvitation(
                    InvitationEntity(
                        invitationId = "INV-${(100000..999999).random()}",
                        senderUserId = referrerUser.userId,
                        senderUsername = referrerUser.username,
                        recipientUserId = createdUser.userId,
                        recipientUsername = createdUser.username,
                        referralCode = referrerUser.referralCode,
                        status = "ACCEPTED",
                        acceptedDate = System.currentTimeMillis(),
                        rewardStatus = "CLAIMED",
                        rewardAmount = bonus
                    )
                )
            }
        }

        // Audit log
        auditLogDao.insertLog(
            AuditLogEntity(
                actorUsername = username,
                action = "USER_REGISTERED",
                details = "User @$username registered with Account ID $accountId"
            )
        )

        return Result.success(createdUser)
    }

    suspend fun loginUser(usernameOrEmailInput: String, passwordInput: String): Result<UserEntity> {
        val query = usernameOrEmailInput.trim()
        val password = passwordInput.trim()

        if (query.isEmpty() || password.isEmpty()) {
            return Result.failure(IllegalArgumentException("Username/Email and Password are required."))
        }

        val user = userDao.getUserByUsername(query) ?: userDao.getUserByEmail(query.lowercase(Locale.ROOT))
        if (user == null || user.passwordHash != password) {
            return Result.failure(IllegalArgumentException("Invalid username/email or password."))
        }

        if (user.accountStatus == "SUSPENDED") {
            return Result.failure(IllegalStateException("This account has been suspended by an administrator."))
        }

        val updatedUser = user.copy(lastLogin = System.currentTimeMillis())
        userDao.updateUser(updatedUser)

        auditLogDao.insertLog(
            AuditLogEntity(
                actorUsername = user.username,
                action = "USER_LOGIN",
                details = "User @${user.username} logged in successfully."
            )
        )

        return Result.success(updatedUser)
    }

    // ----------------------------------------------------
    // ADMIN USER SEARCH & MANAGEMENT
    // ----------------------------------------------------

    fun searchUsers(query: String): Flow<List<UserEntity>> {
        val q = query.trim()
        return if (q.isEmpty()) {
            userDao.getAllUsers()
        } else {
            userDao.searchUsers(q)
        }
    }

    fun getAllUsers(): Flow<List<UserEntity>> = userDao.getAllUsers()

    suspend fun getUserByUsername(username: String): UserEntity? = userDao.getUserByUsername(username)

    suspend fun updateUserStatus(adminUsername: String, targetUsername: String, newStatus: String): Result<Boolean> {
        val target = userDao.getUserByUsername(targetUsername)
            ?: return Result.failure(IllegalArgumentException("User @$targetUsername not found."))

        val updated = target.copy(accountStatus = newStatus)
        userDao.updateUser(updated)

        auditLogDao.insertLog(
            AuditLogEntity(
                actorUsername = adminUsername,
                action = "UPDATE_USER_STATUS",
                details = "Changed account status of @$targetUsername to $newStatus"
            )
        )
        return Result.success(true)
    }

    suspend fun adminAdjustBalance(adminUsername: String, targetUsername: String, delta: Double, reason: String): Result<Double> {
        val target = userDao.getUserByUsername(targetUsername)
            ?: return Result.failure(IllegalArgumentException("User @$targetUsername not found."))

        val newBal = target.balance + delta
        if (newBal < 0) {
            return Result.failure(IllegalArgumentException("Balance cannot be adjusted below $0.00"))
        }

        val updated = target.copy(balance = newBal)
        userDao.updateUser(updated)

        transactionDao.insertTransaction(
            TransactionEntity(
                transactionId = "TXN-ADM-${System.currentTimeMillis()}",
                userId = target.userId,
                username = target.username,
                type = if (delta >= 0) "DEPOSIT" else "WITHDRAWAL",
                amount = Math.abs(delta),
                description = "Admin Credit/Adjustment: $reason"
            )
        )

        auditLogDao.insertLog(
            AuditLogEntity(
                actorUsername = adminUsername,
                action = "ADMIN_BALANCE_ADJUST",
                details = "Adjusted balance for @$targetUsername by $delta USD. Reason: $reason"
            )
        )
        return Result.success(newBal)
    }

    // ----------------------------------------------------
    // INVITATION & REFERRAL SYSTEM
    // ----------------------------------------------------

    suspend fun inviteUserByUsername(senderUsername: String, recipientUsernameInput: String): Result<InvitationEntity> {
        val recipientUsername = recipientUsernameInput.trim().lowercase(Locale.ROOT)
        val sender = userDao.getUserByUsername(senderUsername)
            ?: return Result.failure(IllegalArgumentException("Sender user not found."))

        // 1. Prevent self-invitation
        if (sender.username.equals(recipientUsername, ignoreCase = true)) {
            return Result.failure(IllegalArgumentException("You cannot send an invitation to yourself."))
        }

        // 2. Verify target username exists in database
        val recipient = userDao.getUserByUsername(recipientUsername)
            ?: return Result.failure(IllegalArgumentException("User '@$recipientUsernameInput' does not exist in Vaultix Income."))

        // 3. Prevent duplicate active invitations
        val activeCount = invitationDao.countActiveInvitationsBetween(sender.username, recipient.username)
        if (activeCount > 0) {
            return Result.failure(IllegalStateException("An active invitation already exists for '@${recipient.username}'."))
        }

        // 4. Create Invitation
        val invId = "INV-${(100000..999999).random()}"
        val invitation = InvitationEntity(
            invitationId = invId,
            senderUserId = sender.userId,
            senderUsername = sender.username,
            recipientUserId = recipient.userId,
            recipientUsername = recipient.username,
            referralCode = sender.referralCode,
            status = "PENDING",
            createdDate = System.currentTimeMillis(),
            rewardStatus = "UNCLAIMED",
            rewardAmount = 25.0
        )

        invitationDao.insertInvitation(invitation)

        auditLogDao.insertLog(
            AuditLogEntity(
                actorUsername = sender.username,
                action = "SEND_INVITATION",
                details = "Sent invitation $invId to recipient @${recipient.username}"
            )
        )

        return Result.success(invitation)
    }

    fun getInvitationsForSender(username: String): Flow<List<InvitationEntity>> =
        invitationDao.getInvitationsForSender(username)

    fun getReferredUsersForUsername(username: String): Flow<List<UserEntity>> =
        userDao.getReferredUsersForUsername(username)

    fun searchInvitations(query: String): Flow<List<InvitationEntity>> {
        val q = query.trim()
        return if (q.isEmpty()) {
            invitationDao.getAllInvitations()
        } else {
            invitationDao.searchInvitations(q)
        }
    }

    fun getAllInvitations(): Flow<List<InvitationEntity>> = invitationDao.getAllInvitations()

    // ----------------------------------------------------
    // FINANCIAL TRANSACTIONS & INVESTMENTS
    // ----------------------------------------------------

    fun getTransactionsForUser(userId: String): Flow<List<TransactionEntity>> =
        transactionDao.getTransactionsForUser(userId)

    fun getInvestmentsForUser(userId: String): Flow<List<InvestmentEntity>> =
        investmentDao.getInvestmentsForUser(userId)

    suspend fun depositFunds(username: String, amount: Double, method: String): Result<Double> {
        if (amount <= 0) return Result.failure(IllegalArgumentException("Deposit amount must be greater than $0."))
        val user = userDao.getUserByUsername(username)
            ?: return Result.failure(IllegalArgumentException("User not found."))

        val newBal = user.balance + amount
        val newDeposits = user.totalDeposits + amount
        val updated = user.copy(balance = newBal, totalDeposits = newDeposits)
        userDao.updateUser(updated)

        transactionDao.insertTransaction(
            TransactionEntity(
                transactionId = "TXN-DEP-${System.currentTimeMillis()}",
                userId = user.userId,
                username = user.username,
                type = "DEPOSIT",
                amount = amount,
                description = "Wallet Deposit via $method"
            )
        )

        return Result.success(newBal)
    }

    suspend fun startInvestment(username: String, planName: String, amount: Double, dailyPct: Double, days: Int): Result<InvestmentEntity> {
        if (amount <= 0) return Result.failure(IllegalArgumentException("Investment amount must be greater than $0."))
        val user = userDao.getUserByUsername(username)
            ?: return Result.failure(IllegalArgumentException("User not found."))

        if (user.balance < amount) {
            return Result.failure(IllegalStateException("Insufficient account balance. Available: $${String.format(Locale.US, "%.2f", user.balance)}"))
        }

        val updatedUser = user.copy(
            balance = user.balance - amount,
            totalInvestments = user.totalInvestments + amount
        )
        userDao.updateUser(updatedUser)

        val inv = InvestmentEntity(
            investmentId = "INV-${System.currentTimeMillis().toString().takeLast(6)}",
            userId = user.userId,
            username = user.username,
            planName = planName,
            principalAmount = amount,
            dailyPercentage = dailyPct,
            durationDays = days,
            earnedAmount = 0.0,
            status = "ACTIVE"
        )
        investmentDao.insertInvestment(inv)

        transactionDao.insertTransaction(
            TransactionEntity(
                transactionId = "TXN-INV-${System.currentTimeMillis()}",
                userId = user.userId,
                username = user.username,
                type = "INVESTMENT",
                amount = amount,
                description = "Invested in $planName ($dailyPct%/day for $days days)"
            )
        )

        return Result.success(inv)
    }

    suspend fun requestWithdrawal(username: String, amount: Double): Result<Double> {
        if (amount <= 0) return Result.failure(IllegalArgumentException("Withdrawal amount must be greater than $0."))
        val user = userDao.getUserByUsername(username)
            ?: return Result.failure(IllegalArgumentException("User not found."))

        if (user.balance < amount) {
            return Result.failure(IllegalStateException("Insufficient funds for withdrawal."))
        }

        val updatedUser = user.copy(
            balance = user.balance - amount,
            pendingWithdrawals = user.pendingWithdrawals + amount
        )
        userDao.updateUser(updatedUser)

        transactionDao.insertTransaction(
            TransactionEntity(
                transactionId = "TXN-WD-${System.currentTimeMillis()}",
                userId = user.userId,
                username = user.username,
                type = "WITHDRAWAL",
                amount = amount,
                status = "PENDING",
                description = "Requested Withdrawal to External Vault"
            )
        )

        return Result.success(updatedUser.balance)
    }

    fun getAllAuditLogs(): Flow<List<AuditLogEntity>> = auditLogDao.getAllLogs()
}
