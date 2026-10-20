package com.example.data.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "users",
    indices = [
        Index(value = ["username"], unique = true),
        Index(value = ["email"], unique = true),
        Index(value = ["userId"], unique = true),
        Index(value = ["accountId"], unique = true),
        Index(value = ["referralCode"], unique = true)
    ]
)
data class UserEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val userId: String,          // e.g. "USR-849201"
    val accountId: String,       // e.g. "VX-940281"
    val username: String,        // Unique username e.g. "john_doe"
    val fullName: String,        // e.g. "John Doe"
    val email: String,           // Unique email
    val passwordHash: String,    // Secure hashed password string
    val role: String = "USER",   // "USER" or "ADMIN"
    val accountStatus: String = "ACTIVE", // "ACTIVE", "SUSPENDED", "PENDING_VERIFICATION"
    val registrationDate: Long = System.currentTimeMillis(),
    val lastLogin: Long = System.currentTimeMillis(),
    val balance: Double = 1000.0,
    val totalDeposits: Double = 1000.0,
    val totalInvestments: Double = 0.0,
    val totalProfitLoss: Double = 0.0,
    val pendingWithdrawals: Double = 0.0,
    val referralCode: String,     // e.g. "VXREF-8392"
    val referredByUsername: String? = null // Referrer username if signed up via referral
)
