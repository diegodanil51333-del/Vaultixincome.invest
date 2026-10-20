package com.example.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        UserEntity::class,
        InvitationEntity::class,
        TransactionEntity::class,
        InvestmentEntity::class,
        AuditLogEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class VaultixDatabase : RoomDatabase() {

    abstract fun userDao(): UserDao
    abstract fun invitationDao(): InvitationDao
    abstract fun transactionDao(): TransactionDao
    abstract fun investmentDao(): InvestmentDao
    abstract fun auditLogDao(): AuditLogDao

    companion object {
        @Volatile
        private var INSTANCE: VaultixDatabase? = null

        fun getDatabase(context: Context): VaultixDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    VaultixDatabase::class.java,
                    "vaultix_income.db"
                )
                .fallbackToDestructiveMigration()
                .addCallback(DatabaseCallback())
                .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    CoroutineScope(Dispatchers.IO).launch {
                        seedDatabase(database)
                    }
                }
            }
        }

        suspend fun seedDatabase(db: VaultixDatabase) {
            val userDao = db.userDao()
            if (userDao.getUserCount() == 0) {
                // Seed Primary Admin Account
                val admin = UserEntity(
                    userId = "USR-000001",
                    accountId = "VX-100001",
                    username = "vaultix_admin",
                    fullName = "Vaultix Team Administrator",
                    email = "vaultixincometeam@outlook.com",
                    passwordHash = "VaultixAdmin2026!Secured",
                    role = "ADMIN",
                    accountStatus = "ACTIVE",
                    balance = 250000.0,
                    totalDeposits = 250000.0,
                    totalInvestments = 100000.0,
                    totalProfitLoss = 34500.0,
                    referralCode = "VXREF-ADMIN"
                )
                userDao.insertUser(admin)

                // Seed Test User 01
                val testUser1 = UserEntity(
                    userId = "USR-882901",
                    accountId = "VX-990182",
                    username = "testuser01",
                    fullName = "Alexander Vault",
                    email = "test01@vaultix.com",
                    passwordHash = "password123",
                    role = "USER",
                    accountStatus = "ACTIVE",
                    balance = 15450.0,
                    totalDeposits = 12000.0,
                    totalInvestments = 8000.0,
                    totalProfitLoss = 3450.0,
                    referralCode = "VXREF-8829"
                )
                userDao.insertUser(testUser1)

                // Seed Test User 02 (referred by testuser01)
                val testUser2 = UserEntity(
                    userId = "USR-882902",
                    accountId = "VX-990183",
                    username = "testuser02",
                    fullName = "Sophia Investor",
                    email = "test02@vaultix.com",
                    passwordHash = "password123",
                    role = "USER",
                    accountStatus = "ACTIVE",
                    balance = 5200.0,
                    totalDeposits = 5000.0,
                    totalInvestments = 3000.0,
                    totalProfitLoss = 200.0,
                    referralCode = "VXREF-8830",
                    referredByUsername = "testuser01"
                )
                userDao.insertUser(testUser2)

                // Seed Initial Invitation Record between testuser01 and testuser02
                db.invitationDao().insertInvitation(
                    InvitationEntity(
                        invitationId = "INV-883901",
                        senderUserId = "USR-882901",
                        senderUsername = "testuser01",
                        recipientUserId = "USR-882902",
                        recipientUsername = "testuser02",
                        referralCode = "VXREF-8829",
                        status = "ACCEPTED",
                        acceptedDate = System.currentTimeMillis() - 86400000L,
                        rewardStatus = "CLAIMED",
                        rewardAmount = 25.0
                    )
                )

                // Seed Sample Investments
                db.investmentDao().insertInvestment(
                    InvestmentEntity(
                        investmentId = "INV-YIELD-101",
                        userId = "USR-882901",
                        username = "testuser01",
                        planName = "Vaultix Premier Yield Max",
                        principalAmount = 5000.0,
                        dailyPercentage = 1.8,
                        durationDays = 30,
                        earnedAmount = 450.0,
                        status = "ACTIVE"
                    )
                )

                // Seed Sample Transactions
                db.transactionDao().insertTransaction(
                    TransactionEntity(
                        transactionId = "TXN-990201",
                        userId = "USR-882901",
                        username = "testuser01",
                        type = "DEPOSIT",
                        amount = 12000.0,
                        currency = "USDT",
                        status = "COMPLETED",
                        description = "Initial Crypto Wallet Deposit"
                    )
                )
                db.transactionDao().insertTransaction(
                    TransactionEntity(
                        transactionId = "TXN-990202",
                        userId = "USR-882901",
                        username = "testuser01",
                        type = "REFERRAL_REWARD",
                        amount = 25.0,
                        currency = "USD",
                        status = "COMPLETED",
                        description = "Referral Bonus for inviting testuser02"
                    )
                )

                // Audit Log
                db.auditLogDao().insertLog(
                    AuditLogEntity(
                        actorUsername = "SYSTEM",
                        action = "SYSTEM_INITIALIZED",
                        details = "Vaultix Income Database initialized with default admin and seed accounts."
                    )
                )
            }
        }
    }
}
