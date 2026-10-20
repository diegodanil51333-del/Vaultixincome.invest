package com.example.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.GroupAdd
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.ShowChart
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.VaultixViewModel
import com.example.ui.components.SectionHeader
import com.example.ui.components.StatCard
import com.example.ui.components.StatusChip
import com.example.ui.components.formatCurrency
import com.example.ui.components.formatDate
import com.example.ui.theme.VaultBorder
import com.example.ui.theme.VaultCyan
import com.example.ui.theme.VaultDarkBg
import com.example.ui.theme.VaultEmerald
import com.example.ui.theme.VaultGold
import com.example.ui.theme.VaultRose
import com.example.ui.theme.VaultSurface
import com.example.ui.theme.VaultSurfaceVariant
import com.example.ui.theme.VaultTextMuted
import com.example.ui.theme.VaultTextPrimary
import com.example.ui.theme.VaultTextSecondary

@Composable
fun DashboardScreen(
    viewModel: VaultixViewModel,
    onNavigateToInvest: () -> Unit,
    onNavigateToInvite: () -> Unit,
    onNavigateToWallet: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val currentUser by viewModel.currentUser.collectAsState()
    val transactions by viewModel.userTransactions.collectAsState()

    val user = currentUser ?: return

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(VaultDarkBg)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Portfolio Balance Main Banner Card
        Card(
            colors = CardDefaults.cardColors(containerColor = VaultSurface),
            shape = RoundedCornerShape(20.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, VaultGold.copy(alpha = 0.5f)),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("portfolio_balance_card")
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "TOTAL PORTFOLIO BALANCE",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = VaultTextMuted,
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = formatCurrency(user.balance),
                            fontSize = 32.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = VaultGold
                        )
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(VaultSurfaceVariant)
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = user.accountId,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = VaultCyan
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = onNavigateToWallet,
                        modifier = Modifier
                            .weight(1f)
                            .height(42.dp)
                            .testTag("quick_deposit_btn"),
                        colors = ButtonDefaults.buttonColors(containerColor = VaultGold, contentColor = Color.Black),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.ArrowDownward, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Deposit", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }

                    Button(
                        onClick = onNavigateToInvest,
                        modifier = Modifier
                            .weight(1f)
                            .height(42.dp)
                            .testTag("quick_invest_btn"),
                        colors = ButtonDefaults.buttonColors(containerColor = VaultEmerald, contentColor = Color.Black),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.TrendingUp, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Invest", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }

                    OutlinedButton(
                        onClick = onNavigateToWallet,
                        modifier = Modifier
                            .weight(1f)
                            .height(42.dp)
                            .testTag("quick_withdraw_btn"),
                        border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.ArrowUpward, contentDescription = null, tint = VaultTextPrimary, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Withdraw", color = VaultTextPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Financial Metrics Grid
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                title = "Total Deposits",
                value = formatCurrency(user.totalDeposits),
                icon = Icons.Default.AccountBalanceWallet,
                iconColor = VaultCyan,
                modifier = Modifier.weight(1f),
                testTag = "stat_deposits"
            )
            StatCard(
                title = "Active Invested",
                value = formatCurrency(user.totalInvestments),
                icon = Icons.Default.ShowChart,
                iconColor = VaultEmerald,
                modifier = Modifier.weight(1f),
                testTag = "stat_invested"
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                title = "Total Earned Profit",
                value = formatCurrency(user.totalProfitLoss),
                icon = Icons.Default.MonetizationOn,
                iconColor = VaultGold,
                modifier = Modifier.weight(1f),
                testTag = "stat_profit"
            )
            StatCard(
                title = "Referred By",
                value = if (user.referredByUsername != null) "@${user.referredByUsername}" else "Direct",
                icon = Icons.Default.GroupAdd,
                iconColor = VaultRose,
                modifier = Modifier.weight(1f),
                testTag = "stat_referrer"
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Quick Invite Friends Banner
        Card(
            colors = CardDefaults.cardColors(containerColor = VaultSurfaceVariant),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(VaultEmerald.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.GroupAdd, contentDescription = null, tint = VaultEmerald)
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Invite Friends & Earn $25",
                        fontWeight = FontWeight.Bold,
                        color = VaultTextPrimary,
                        fontSize = 14.sp
                    )
                    Text(
                        text = "Ref Code: ${user.referralCode}",
                        color = VaultTextSecondary,
                        fontSize = 12.sp
                    )
                }

                Button(
                    onClick = onNavigateToInvite,
                    colors = ButtonDefaults.buttonColors(containerColor = VaultEmerald, contentColor = Color.Black),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Invite", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Recent Transactions Section
        SectionHeader(title = "Recent Transactions", subtitle = "Your latest deposit, investment & reward activity")

        Spacer(modifier = Modifier.height(10.dp))

        if (transactions.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(VaultSurface)
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("No recent transaction activity.", color = VaultTextMuted, fontSize = 13.sp)
            }
        } else {
            transactions.take(5).forEach { tx ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = VaultSurface),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = tx.description,
                                fontWeight = FontWeight.Bold,
                                color = VaultTextPrimary,
                                fontSize = 13.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = formatDate(tx.timestamp),
                                color = VaultTextMuted,
                                fontSize = 11.sp
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            val sign = if (tx.type in listOf("DEPOSIT", "PROFIT", "REFERRAL_REWARD")) "+" else "-"
                            val txColor = if (sign == "+") VaultEmerald else VaultTextPrimary
                            Text(
                                text = "$sign${formatCurrency(tx.amount)}",
                                fontWeight = FontWeight.Bold,
                                color = txColor,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            StatusChip(status = tx.status)
                        }
                    }
                }
            }
        }
    }
}
