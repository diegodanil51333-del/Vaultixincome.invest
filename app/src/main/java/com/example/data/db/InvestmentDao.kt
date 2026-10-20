package com.example.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface InvestmentDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInvestment(investment: InvestmentEntity): Long

    @Update
    suspend fun updateInvestment(investment: InvestmentEntity)

    @Query("SELECT * FROM investments WHERE userId = :userId ORDER BY startDate DESC")
    fun getInvestmentsForUser(userId: String): Flow<List<InvestmentEntity>>

    @Query("SELECT * FROM investments WHERE username = :username ORDER BY startDate DESC")
    fun getInvestmentsForUsername(username: String): Flow<List<InvestmentEntity>>

    @Query("SELECT * FROM investments ORDER BY startDate DESC")
    fun getAllInvestments(): Flow<List<InvestmentEntity>>
}
