package com.example.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "audit_logs")
data class AuditLogEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val actorUsername: String,
    val action: String,
    val details: String,
    val timestamp: Long = System.currentTimeMillis()
)
