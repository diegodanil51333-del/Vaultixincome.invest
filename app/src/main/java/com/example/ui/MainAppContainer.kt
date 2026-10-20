package com.example.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.CurrencyBitcoin
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.GroupAdd
import androidx.compose.material.icons.filled.Help
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.ShowChart
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.components.StatusChip
import com.example.ui.screens.AdminReferralsScreen
import com.example.ui.screens.AdminUsersScreen
import com.example.ui.screens.AuthScreen
import com.example.ui.screens.BuyCryptoScreen
import com.example.ui.screens.DashboardScreen
import com.example.ui.screens.InvestmentsScreen
import com.example.ui.screens.InviteFriendsScreen
import com.example.ui.screens.SupportScreen
import com.example.ui.screens.WalletScreen
import com.example.ui.theme.VaultAdminBadge
import com.example.ui.theme.VaultDarkBg
import com.example.ui.theme.VaultGold
import com.example.ui.theme.VaultSurface
import com.example.ui.theme.VaultTextMuted
import com.example.ui.theme.VaultTextPrimary
import com.example.ui.theme.VaultTextSecondary

enum class NavDestination {
    DASHBOARD,
    INVESTMENTS,
    BUY_CRYPTO,
    INVITE,
    WALLET,
    SUPPORT,
    ADMIN
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppContainer(
    viewModel: VaultixViewModel
) {
    val currentUser by viewModel.currentUser.collectAsState()

    if (currentUser == null) {
        AuthScreen(viewModel = viewModel)
        return
    }

    val user = currentUser!!

    var currentNav by remember(user.username) {
        mutableIntStateOf(
            if (user.role == "ADMIN") NavDestination.ADMIN.ordinal else NavDestination.DASHBOARD.ordinal
        )
    }

    var adminTab by remember { mutableIntStateOf(0) } // 0: All Users, 1: Referrals

    Scaffold(
        topBar = {
            TopAppBar(
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = VaultSurface,
                    titleContentColor = VaultTextPrimary
                ),
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(VaultGold.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Shield, contentDescription = null, tint = VaultGold, modifier = Modifier.size(20.dp))
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text("VAULTIX INCOME", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = VaultGold, letterSpacing = 1.sp)
                            Text("@${user.username}", fontSize = 11.sp, color = VaultTextSecondary)
                        }
                    }
                },
                actions = {
                    StatusChip(status = user.role)
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(
                        onClick = { viewModel.logout() },
                        modifier = Modifier.testTag("logout_button")
                    ) {
                        Icon(Icons.Default.Logout, contentDescription = "Log Out", tint = VaultTextMuted)
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = VaultSurface,
                contentColor = VaultGold
            ) {
                NavigationBarItem(
                    selected = currentNav == NavDestination.DASHBOARD.ordinal,
                    onClick = { currentNav = NavDestination.DASHBOARD.ordinal },
                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "Dashboard") },
                    label = { Text("Home", fontSize = 9.sp) },
                    modifier = Modifier.testTag("nav_dashboard"),
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = VaultGold,
                        selectedTextColor = VaultGold,
                        unselectedIconColor = VaultTextMuted,
                        unselectedTextColor = VaultTextMuted,
                        indicatorColor = VaultGold.copy(alpha = 0.2f)
                    )
                )

                NavigationBarItem(
                    selected = currentNav == NavDestination.INVESTMENTS.ordinal,
                    onClick = { currentNav = NavDestination.INVESTMENTS.ordinal },
                    icon = { Icon(Icons.Default.ShowChart, contentDescription = "Investments") },
                    label = { Text("Vaults", fontSize = 9.sp) },
                    modifier = Modifier.testTag("nav_investments"),
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = VaultGold,
                        selectedTextColor = VaultGold,
                        unselectedIconColor = VaultTextMuted,
                        unselectedTextColor = VaultTextMuted,
                        indicatorColor = VaultGold.copy(alpha = 0.2f)
                    )
                )

                NavigationBarItem(
                    selected = currentNav == NavDestination.BUY_CRYPTO.ordinal,
                    onClick = { currentNav = NavDestination.BUY_CRYPTO.ordinal },
                    icon = { Icon(Icons.Default.CurrencyBitcoin, contentDescription = "Buy Crypto") },
                    label = { Text("Buy Crypto", fontSize = 9.sp) },
                    modifier = Modifier.testTag("nav_buy_crypto"),
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = VaultGold,
                        selectedTextColor = VaultGold,
                        unselectedIconColor = VaultTextMuted,
                        unselectedTextColor = VaultTextMuted,
                        indicatorColor = VaultGold.copy(alpha = 0.2f)
                    )
                )

                NavigationBarItem(
                    selected = currentNav == NavDestination.INVITE.ordinal,
                    onClick = { currentNav = NavDestination.INVITE.ordinal },
                    icon = { Icon(Icons.Default.GroupAdd, contentDescription = "Invite Friends") },
                    label = { Text("Invite", fontSize = 9.sp) },
                    modifier = Modifier.testTag("nav_invite"),
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = VaultGold,
                        selectedTextColor = VaultGold,
                        unselectedIconColor = VaultTextMuted,
                        unselectedTextColor = VaultTextMuted,
                        indicatorColor = VaultGold.copy(alpha = 0.2f)
                    )
                )

                NavigationBarItem(
                    selected = currentNav == NavDestination.WALLET.ordinal,
                    onClick = { currentNav = NavDestination.WALLET.ordinal },
                    icon = { Icon(Icons.Default.AccountBalanceWallet, contentDescription = "Wallet") },
                    label = { Text("Wallet", fontSize = 9.sp) },
                    modifier = Modifier.testTag("nav_wallet"),
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = VaultGold,
                        selectedTextColor = VaultGold,
                        unselectedIconColor = VaultTextMuted,
                        unselectedTextColor = VaultTextMuted,
                        indicatorColor = VaultGold.copy(alpha = 0.2f)
                    )
                )

                NavigationBarItem(
                    selected = currentNav == NavDestination.SUPPORT.ordinal,
                    onClick = { currentNav = NavDestination.SUPPORT.ordinal },
                    icon = { Icon(Icons.Default.Help, contentDescription = "Support") },
                    label = { Text("Support", fontSize = 9.sp) },
                    modifier = Modifier.testTag("nav_support"),
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = VaultGold,
                        selectedTextColor = VaultGold,
                        unselectedIconColor = VaultTextMuted,
                        unselectedTextColor = VaultTextMuted,
                        indicatorColor = VaultGold.copy(alpha = 0.2f)
                    )
                )

                if (user.role == "ADMIN") {
                    NavigationBarItem(
                        selected = currentNav == NavDestination.ADMIN.ordinal,
                        onClick = { currentNav = NavDestination.ADMIN.ordinal },
                        icon = { Icon(Icons.Default.AdminPanelSettings, contentDescription = "Admin Panel") },
                        label = { Text("Admin", fontSize = 9.sp) },
                        modifier = Modifier.testTag("nav_admin"),
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = VaultAdminBadge,
                            selectedTextColor = VaultAdminBadge,
                            unselectedIconColor = VaultTextMuted,
                            unselectedTextColor = VaultTextMuted,
                            indicatorColor = VaultAdminBadge.copy(alpha = 0.2f)
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(VaultDarkBg)
        ) {
            when (currentNav) {
                NavDestination.DASHBOARD.ordinal -> {
                    DashboardScreen(
                        viewModel = viewModel,
                        onNavigateToInvest = { currentNav = NavDestination.INVESTMENTS.ordinal },
                        onNavigateToInvite = { currentNav = NavDestination.INVITE.ordinal },
                        onNavigateToWallet = { currentNav = NavDestination.WALLET.ordinal }
                    )
                }
                NavDestination.INVESTMENTS.ordinal -> {
                    InvestmentsScreen(viewModel = viewModel)
                }
                NavDestination.BUY_CRYPTO.ordinal -> {
                    BuyCryptoScreen(viewModel = viewModel)
                }
                NavDestination.INVITE.ordinal -> {
                    InviteFriendsScreen(viewModel = viewModel)
                }
                NavDestination.WALLET.ordinal -> {
                    WalletScreen(viewModel = viewModel)
                }
                NavDestination.SUPPORT.ordinal -> {
                    SupportScreen(viewModel = viewModel)
                }
                NavDestination.ADMIN.ordinal -> {
                    if (user.role == "ADMIN") {
                        Column(modifier = Modifier.fillMaxSize()) {
                            TabRow(
                                selectedTabIndex = adminTab,
                                containerColor = VaultSurface,
                                contentColor = VaultAdminBadge,
                                indicator = { tabPositions ->
                                    TabRowDefaults.SecondaryIndicator(
                                        modifier = Modifier.tabIndicatorOffset(tabPositions[adminTab]),
                                        color = VaultAdminBadge
                                    )
                                }
                            ) {
                                Tab(
                                    selected = adminTab == 0,
                                    onClick = { adminTab = 0 },
                                    text = { Text("ALL USERS", fontWeight = FontWeight.Bold, fontSize = 12.sp) },
                                    modifier = Modifier.testTag("admin_users_tab")
                                )
                                Tab(
                                    selected = adminTab == 1,
                                    onClick = { adminTab = 1 },
                                    text = { Text("REFERRAL MANAGEMENT", fontWeight = FontWeight.Bold, fontSize = 12.sp) },
                                    modifier = Modifier.testTag("admin_referrals_tab")
                                )
                            }

                            if (adminTab == 0) {
                                AdminUsersScreen(viewModel = viewModel)
                            } else {
                                AdminReferralsScreen(viewModel = viewModel)
                            }
                        }
                    } else {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("Access Denied: Server-side Admin privileges required.", color = VaultTextMuted)
                        }
                    }
                }
            }
        }
    }
}
