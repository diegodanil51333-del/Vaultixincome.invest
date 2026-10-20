package com.example.data.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "transactions",
    indices = [
        Index(value = ["transactionId"], unique = true),
        Index(value = ["userId"]),
        Index(value = ["username"])
    ]
)
data class TransactionEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val transactionId: String,   // e.g. "TXN-882910"
    val userId: String,
    val username: String,
    val type: String,            // "DEPOSIT", "WITHDRAWAL", "INVESTMENT", "PROFIT", "REFERRAL_REWARD"
    val amount: Double,
    val currency: String = "USD",
    val status: String = "COMPLETED", // "COMPLETED", "PENDING", "REJECTED"
    val description: String,
    val timestamp: Long = System.currentTimeMillis()
)
