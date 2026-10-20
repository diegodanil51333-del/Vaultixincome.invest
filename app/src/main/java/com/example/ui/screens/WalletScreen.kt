package com.example.ui.screens

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.CurrencyBitcoin
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.VaultixViewModel
import com.example.ui.components.SectionHeader
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
fun WalletScreen(
    viewModel: VaultixViewModel,
    modifier: Modifier = Modifier
) {
    val currentUser by viewModel.currentUser.collectAsState()
    val transactions by viewModel.userTransactions.collectAsState()

    var showDepositModal by remember { mutableStateOf(false) }
    var showWithdrawModal by remember { mutableStateOf(false) }

    val user = currentUser ?: return

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(VaultDarkBg)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        SectionHeader(
            title = "Wallet & Liquidity",
            subtitle = "Manage instant deposits, pending withdrawals & transaction history"
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Balance Overview Card
        Card(
            colors = CardDefaults.cardColors(containerColor = VaultSurface),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text("AVAILABLE LIQUID BALANCE", color = VaultTextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                Text(formatCurrency(user.balance), color = VaultGold, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold)

                if (user.pendingWithdrawals > 0) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Pending Withdrawals: ${formatCurrency(user.pendingWithdrawals)}", color = VaultRose, fontSize = 12.sp)
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = { showDepositModal = true },
                        modifier = Modifier
                            .weight(1f)
                            .height(44.dp)
                            .testTag("deposit_modal_open_btn"),
                        colors = ButtonDefaults.buttonColors(containerColor = VaultEmerald, contentColor = Color.Black),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("DEPOSIT", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }

                    OutlinedButton(
                        onClick = { showWithdrawModal = true },
                        modifier = Modifier
                            .weight(1f)
                            .height(44.dp)
                            .testTag("withdraw_modal_open_btn"),
                        border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.ArrowUpward, contentDescription = null, tint = VaultTextPrimary, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("WITHDRAW", color = VaultTextPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Complete Transaction History
        SectionHeader(title = "Transaction Ledger", subtitle = "Audited record of all financial movements")

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
                Text("No transaction history recorded yet.", color = VaultTextMuted, fontSize = 13.sp)
            }
        } else {
            transactions.forEach { tx ->
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
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(tx.description, fontWeight = FontWeight.Bold, color = VaultTextPrimary, fontSize = 13.sp)
                            Text("ID: ${tx.transactionId} • ${formatDate(tx.timestamp)}", color = VaultTextMuted, fontSize = 11.sp)
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            val sign = if (tx.type in listOf("DEPOSIT", "PROFIT", "REFERRAL_REWARD")) "+" else "-"
                            val txColor = if (sign == "+") VaultEmerald else VaultTextPrimary
                            Text("$sign${formatCurrency(tx.amount)}", fontWeight = FontWeight.Bold, color = txColor, fontSize = 14.sp)
                            Spacer(modifier = Modifier.height(2.dp))
                            StatusChip(status = tx.status)
                        }
                    }
                }
            }
        }
    }

    // Deposit Dialog Modal
    if (showDepositModal) {
        var amountStr by remember { mutableStateOf("500") }
        var methodStr by remember { mutableStateOf("USDT TRC20") }

        AlertDialog(
            onDismissRequest = { showDepositModal = false },
            confirmButton = {
                Button(
                    onClick = {
                        val amt = amountStr.toDoubleOrNull() ?: 0.0
                        if (amt > 0) {
                            viewModel.deposit(amt, methodStr)
                            showDepositModal = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = VaultEmerald, contentColor = Color.Black),
                    modifier = Modifier.testTag("deposit_confirm_btn")
                ) {
                    Text("COMPLETE DEPOSIT", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDepositModal = false }) {
                    Text("CANCEL", color = VaultTextSecondary)
                }
            },
            title = { Text("Deposit Funds into Vault", fontWeight = FontWeight.Bold, color = VaultTextPrimary) },
            text = {
                Column {
                    OutlinedTextField(
                        value = amountStr,
                        onValueChange = { amountStr = it },
                        label = { Text("Amount (USD)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("deposit_amount_input"),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = VaultEmerald,
                            unfocusedBorderColor = VaultBorder
                        )
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Text("Select Payment Gateway:", fontSize = 12.sp, color = VaultTextSecondary)
                    Spacer(modifier = Modifier.height(6.dp))

                    listOf("USDT TRC20", "Bitcoin (BTC)", "Direct Wire Transfer", "Credit Card / Crypto").forEach { m ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (methodStr == m) VaultEmerald.copy(alpha = 0.2f) else VaultSurfaceVariant)
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            TextButton(
                                onClick = { methodStr = m },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(m, color = if (methodStr == m) VaultEmerald else VaultTextPrimary, fontWeight = FontWeight.Bold)
                            }
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                    }
                }
            },
            containerColor = VaultSurface
        )
    }

    // Withdrawal Dialog Modal
    if (showWithdrawModal) {
        var withdrawAmtStr by remember { mutableStateOf("") }
        var withdrawError by remember { mutableStateOf<String?>(null) }

        AlertDialog(
            onDismissRequest = { showWithdrawModal = false },
            confirmButton = {
                Button(
                    onClick = {
                        val amt = withdrawAmtStr.toDoubleOrNull()
                        if (amt == null || amt <= 0) {
                            withdrawError = "Please enter a valid amount."
                        } else if (amt > user.balance) {
                            withdrawError = "Insufficient balance."
                        } else {
                            viewModel.requestWithdrawal(amt)
                            showWithdrawModal = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = VaultGold, contentColor = Color.Black),
                    modifier = Modifier.testTag("withdraw_confirm_btn")
                ) {
                    Text("REQUEST WITHDRAWAL", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showWithdrawModal = false }) {
                    Text("CANCEL", color = VaultTextSecondary)
                }
            },
            title = { Text("Request Withdrawal", fontWeight = FontWeight.Bold, color = VaultTextPrimary) },
            text = {
                Column {
                    Text("Available Liquid Balance: ${formatCurrency(user.balance)}", color = VaultGold, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = withdrawAmtStr,
                        onValueChange = {
                            withdrawAmtStr = it
                            withdrawError = null
                        },
                        label = { Text("Withdrawal Amount (USD)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("withdraw_amount_input"),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = VaultGold,
                            unfocusedBorderColor = VaultBorder
                        )
                    )

                    withdrawError?.let { err ->
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(err, color = VaultRose, fontSize = 12.sp)
                    }
                }
            },
            containerColor = VaultSurface
        )
    }
}
