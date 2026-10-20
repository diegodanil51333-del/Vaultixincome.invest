package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.db.AuditLogEntity
import com.example.data.db.InvitationEntity
import com.example.data.db.InvestmentEntity
import com.example.data.db.TransactionEntity
import com.example.data.db.UserEntity
import com.example.data.db.VaultixDatabase
import com.example.data.repository.VaultixRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class VaultixViewModel(application: Application) : AndroidViewModel(application) {

    private val db = VaultixDatabase.getDatabase(application)
    val repository = VaultixRepository(db)

    // Logged in user
    private val _currentUser = MutableStateFlow<UserEntity?>(null)
    val currentUser: StateFlow<UserEntity?> = _currentUser.asStateFlow()

    // Alert Messages & Dialog Feedback
    private val _uiMessage = MutableStateFlow<String?>(null)
    val uiMessage: StateFlow<String?> = _uiMessage.asStateFlow()

    private val _uiError = MutableStateFlow<String?>(null)
    val uiError: StateFlow<String?> = _uiError.asStateFlow()

    // Admin Search state
    private val _adminSearchQuery = MutableStateFlow("")
    val adminSearchQuery: StateFlow<String> = _adminSearchQuery.asStateFlow()

    @OptIn(ExperimentalCoroutinesApi::class)
    val adminUsersList: StateFlow<List<UserEntity>> = _adminSearchQuery
        .flatMapLatest { query -> repository.searchUsers(query) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Admin Selected User Profile
    private val _selectedAdminUser = MutableStateFlow<UserEntity?>(null)
    val selectedAdminUser: StateFlow<UserEntity?> = _selectedAdminUser.asStateFlow()

    // Admin Referral Search
    private val _adminReferralQuery = MutableStateFlow("")
    val adminReferralQuery: StateFlow<String> = _adminReferralQuery.asStateFlow()

    @OptIn(ExperimentalCoroutinesApi::class)
    val adminReferralsList: StateFlow<List<InvitationEntity>> = _adminReferralQuery
        .flatMapLatest { query -> repository.searchInvitations(query) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Current User Data Streams
    @OptIn(ExperimentalCoroutinesApi::class)
    val userSentInvitations: StateFlow<List<InvitationEntity>> = _currentUser
        .flatMapLatest { user ->
            if (user != null) repository.getInvitationsForSender(user.username) else flowOf(emptyList())
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    @OptIn(ExperimentalCoroutinesApi::class)
    val userReferredAccounts: StateFlow<List<UserEntity>> = _currentUser
        .flatMapLatest { user ->
            if (user != null) repository.getReferredUsersForUsername(user.username) else flowOf(emptyList())
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    @OptIn(ExperimentalCoroutinesApi::class)
    val userTransactions: StateFlow<List<TransactionEntity>> = _currentUser
        .flatMapLatest { user ->
            if (user != null) repository.getTransactionsForUser(user.userId) else flowOf(emptyList())
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    @OptIn(ExperimentalCoroutinesApi::class)
    val userInvestments: StateFlow<List<InvestmentEntity>> = _currentUser
        .flatMapLatest { user ->
            if (user != null) repository.getInvestmentsForUser(user.userId) else flowOf(emptyList())
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val auditLogs: StateFlow<List<AuditLogEntity>> = repository.getAllAuditLogs()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        // Auto seed DB
        viewModelScope.launch {
            VaultixDatabase.seedDatabase(db)
        }
    }

    fun clearUiMessages() {
        _uiMessage.value = null
        _uiError.value = null
    }

    // ----------------------------------------------------
    // AUTH ACTIONS
    // ----------------------------------------------------

    fun register(
        username: String,
        fullName: String,
        email: String,
        password: String,
        passwordConfirm: String,
        referralCode: String?
    ) {
        viewModelScope.launch {
            clearUiMessages()
            val result = repository.registerUser(
                usernameInput = username,
                fullNameInput = fullName,
                emailInput = email,
                passwordInput = password,
                passwordConfirmInput = passwordConfirm,
                referralCodeInput = referralCode
            )
            result.onSuccess { user ->
                _currentUser.value = user
                _uiMessage.value = "Registration successful! Welcome to Vaultix Income, @${user.username}"
            }.onFailure { err ->
                _uiError.value = err.message ?: "Registration failed."
            }
        }
    }

    fun login(usernameOrEmail: String, password: String) {
        viewModelScope.launch {
            clearUiMessages()
            val result = repository.loginUser(usernameOrEmail, password)
            result.onSuccess { user ->
                _currentUser.value = user
                _uiMessage.value = "Welcome back, @${user.username}!"
            }.onFailure { err ->
                _uiError.value = err.message ?: "Login failed."
            }
        }
    }

    fun logout() {
        _currentUser.value = null
        _selectedAdminUser.value = null
        _uiMessage.value = "Logged out successfully."
    }

    fun refreshUser() {
        val curr = _currentUser.value ?: return
        viewModelScope.launch {
            val updated = repository.getUserByUsername(curr.username)
            if (updated != null) {
                _currentUser.value = updated
            }
        }
    }

    // ----------------------------------------------------
    // ADMIN ACTIONS
    // ----------------------------------------------------

    fun setAdminSearchQuery(query: String) {
        _adminSearchQuery.value = query
    }

    fun setAdminReferralQuery(query: String) {
        _adminReferralQuery.value = query
    }

    fun selectAdminUser(user: UserEntity?) {
        _selectedAdminUser.value = user
    }

    fun updateTargetUserStatus(targetUsername: String, newStatus: String) {
        val admin = _currentUser.value ?: return
        if (admin.role != "ADMIN") return

        viewModelScope.launch {
            clearUiMessages()
            val res = repository.updateUserStatus(admin.username, targetUsername, newStatus)
            res.onSuccess {
                _uiMessage.value = "Updated @$targetUsername account status to $newStatus"
                // Refresh selected admin user
                val updated = repository.getUserByUsername(targetUsername)
                _selectedAdminUser.value = updated
            }.onFailure {
                _uiError.value = it.message ?: "Failed to update status."
            }
        }
    }

    fun adjustUserBalance(targetUsername: String, delta: Double, reason: String) {
        val admin = _currentUser.value ?: return
        if (admin.role != "ADMIN") return

        viewModelScope.launch {
            clearUiMessages()
            val res = repository.adminAdjustBalance(admin.username, targetUsername, delta, reason)
            res.onSuccess { newBal ->
                _uiMessage.value = "Adjusted balance for @$targetUsername. New Balance: $$newBal"
                val updated = repository.getUserByUsername(targetUsername)
                _selectedAdminUser.value = updated
            }.onFailure {
                _uiError.value = it.message ?: "Failed to adjust balance."
            }
        }
    }

    // ----------------------------------------------------
    // INVITATIONS & REFERRALS
    // ----------------------------------------------------

    fun sendInvitation(targetUsername: String) {
        val sender = _currentUser.value ?: return
        viewModelScope.launch {
            clearUiMessages()
            val res = repository.inviteUserByUsername(sender.username, targetUsername)
            res.onSuccess { inv ->
                _uiMessage.value = "Invitation successfully sent to @${inv.recipientUsername}!"
            }.onFailure {
                _uiError.value = it.message ?: "Failed to send invitation."
            }
        }
    }

    // ----------------------------------------------------
    // FINANCIAL OPERATIONS
    // ----------------------------------------------------

    fun deposit(amount: Double, method: String) {
        val user = _currentUser.value ?: return
        viewModelScope.launch {
            clearUiMessages()
            val res = repository.depositFunds(user.username, amount, method)
            res.onSuccess { newBal ->
                _uiMessage.value = "Successfully deposited $$amount via $method."
                refreshUser()
            }.onFailure {
                _uiError.value = it.message ?: "Deposit failed."
            }
        }
    }

    fun createInvestment(planName: String, amount: Double, dailyPct: Double, days: Int) {
        val user = _currentUser.value ?: return
        viewModelScope.launch {
            clearUiMessages()
            val res = repository.startInvestment(user.username, planName, amount, dailyPct, days)
            res.onSuccess {
                _uiMessage.value = "Successfully invested $$amount in $planName!"
                refreshUser()
            }.onFailure {
                _uiError.value = it.message ?: "Investment failed."
            }
        }
    }

    fun requestWithdrawal(amount: Double) {
        val user = _currentUser.value ?: return
        viewModelScope.launch {
            clearUiMessages()
            val res = repository.requestWithdrawal(user.username, amount)
            res.onSuccess {
                _uiMessage.value = "Withdrawal request submitted for $$amount."
                refreshUser()
            }.onFailure {
                _uiError.value = it.message ?: "Withdrawal request failed."
            }
        }
    }
}
