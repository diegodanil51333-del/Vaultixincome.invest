package com.example.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insertUser(user: UserEntity): Long

    @Update
    suspend fun updateUser(user: UserEntity)

    @Query("SELECT * FROM users WHERE username = :username COLLATE NOCASE LIMIT 1")
    suspend fun getUserByUsername(username: String): UserEntity?

    @Query("SELECT * FROM users WHERE email = :email COLLATE NOCASE LIMIT 1")
    suspend fun getUserByEmail(email: String): UserEntity?

    @Query("SELECT * FROM users WHERE userId = :userId LIMIT 1")
    suspend fun getUserByUserId(userId: String): UserEntity?

    @Query("SELECT * FROM users WHERE accountId = :accountId LIMIT 1")
    suspend fun getUserByAccountId(accountId: String): UserEntity?

    @Query("SELECT * FROM users WHERE referralCode = :code LIMIT 1")
    suspend fun getUserByReferralCode(code: String): UserEntity?

    @Query("SELECT * FROM users ORDER BY registrationDate DESC")
    fun getAllUsers(): Flow<List<UserEntity>>

    @Query("""
        SELECT * FROM users 
        WHERE username LIKE '%' || :query || '%'
           OR email LIKE '%' || :query || '%'
           OR accountId LIKE '%' || :query || '%'
           OR userId LIKE '%' || :query || '%'
           OR fullName LIKE '%' || :query || '%'
        ORDER BY registrationDate DESC
    """)
    fun searchUsers(query: String): Flow<List<UserEntity>>

    @Query("SELECT COUNT(*) FROM users")
    suspend fun getUserCount(): Int

    @Query("SELECT COUNT(*) FROM users WHERE referredByUsername = :username")
    fun getReferralCountForUserFlow(username: String): Flow<Int>

    @Query("SELECT COUNT(*) FROM users WHERE referredByUsername = :username")
    suspend fun getReferralCountForUser(username: String): Int

    @Query("SELECT * FROM users WHERE referredByUsername = :username ORDER BY registrationDate DESC")
    fun getReferredUsersForUsername(username: String): Flow<List<UserEntity>>
}
