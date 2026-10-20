package com.example.data.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "invitations",
    indices = [
        Index(value = ["invitationId"], unique = true),
        Index(value = ["senderUsername"]),
        Index(value = ["recipientUsername"]),
        Index(value = ["referralCode"])
    ]
)
data class InvitationEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val invitationId: String,          // e.g. "INV-99021"
    val senderUserId: String,          // User ID of inviter
    val senderUsername: String,        // Username of inviter
    val recipientUserId: String? = null,// Recipient user ID once registered/matched
    val recipientUsername: String,     // Target username invited
    val referralCode: String,          // Inviter's referral code
    val status: String = "PENDING",    // "PENDING", "ACCEPTED", "DECLINED", "EXPIRED", "CANCELLED"
    val createdDate: Long = System.currentTimeMillis(),
    val acceptedDate: Long? = null,
    val rewardStatus: String = "UNCLAIMED", // "UNCLAIMED", "CLAIMED", "PENDING_QUALIFICATION"
    val rewardAmount: Double = 25.0    // USD reward for successful referral
)
