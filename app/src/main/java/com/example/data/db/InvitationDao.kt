package com.example.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface InvitationDao {
    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insertInvitation(invitation: InvitationEntity): Long

    @Update
    suspend fun updateInvitation(invitation: InvitationEntity)

    @Query("SELECT * FROM invitations WHERE invitationId = :invitationId LIMIT 1")
    suspend fun getInvitationById(invitationId: String): InvitationEntity?

    @Query("SELECT * FROM invitations WHERE senderUsername = :senderUsername ORDER BY createdDate DESC")
    fun getInvitationsForSender(senderUsername: String): Flow<List<InvitationEntity>>

    @Query("SELECT * FROM invitations WHERE recipientUsername = :recipientUsername ORDER BY createdDate DESC")
    fun getInvitationsForRecipient(recipientUsername: String): Flow<List<InvitationEntity>>

    @Query("""
        SELECT COUNT(*) FROM invitations 
        WHERE senderUsername = :senderUsername 
          AND recipientUsername = :recipientUsername 
          AND status IN ('PENDING', 'ACCEPTED')
    """)
    suspend fun countActiveInvitationsBetween(senderUsername: String, recipientUsername: String): Int

    @Query("SELECT * FROM invitations ORDER BY createdDate DESC")
    fun getAllInvitations(): Flow<List<InvitationEntity>>

    @Query("""
        SELECT * FROM invitations 
        WHERE senderUsername LIKE '%' || :query || '%'
           OR recipientUsername LIKE '%' || :query || '%'
           OR referralCode LIKE '%' || :query || '%'
           OR invitationId LIKE '%' || :query || '%'
        ORDER BY createdDate DESC
    """)
    fun searchInvitations(query: String): Flow<List<InvitationEntity>>
}
