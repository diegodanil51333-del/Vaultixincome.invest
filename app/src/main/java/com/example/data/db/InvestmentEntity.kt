package com.example.data.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "investments",
    indices = [
        Index(value = ["investmentId"], unique = true),
        Index(value = ["userId"]),
        Index(value = ["username"])
    ]
)
data class InvestmentEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val investmentId: String,    // e.g. "INV-ALPH-01"
    val userId: String,
    val username: String,
    val planName: String,        // e.g. "Vaultix Yield Max", "Crypto Staking Vault"
    val principalAmount: Double,
    val dailyPercentage: Double, // e.g. 1.8
    val durationDays: Int,       // e.g. 30
    val earnedAmount: Double = 0.0,
    val status: String = "ACTIVE", // "ACTIVE", "COMPLETED", "CANCELLED"
    val startDate: Long = System.currentTimeMillis(),
    val endDate: Long = System.currentTimeMillis() + (30L * 24 * 3600 * 1000)
)
