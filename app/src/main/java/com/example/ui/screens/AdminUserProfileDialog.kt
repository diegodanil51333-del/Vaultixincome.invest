package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AlternateEmail
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
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
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.db.UserEntity
import com.example.ui.VaultixViewModel
import com.example.ui.components.SectionHeader
import com.example.ui.components.StatusChip
import com.example.ui.components.formatCurrency
import com.example.ui.components.formatDate
import com.example.ui.theme.VaultAdminBadge
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
fun AdminUserProfileDialog(
    user: UserEntity,
    viewModel: VaultixViewModel,
    onDismiss: () -> Unit
) {
    var showAdjustModal by remember { mutableStateOf(false) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.9f)
                .clip(RoundedCornerShape(20.dp)),
            color = VaultDarkBg,
            border = androidx.compose.foundation.BorderStroke(1.dp, VaultAdminBadge.copy(alpha = 0.5f))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Dialog Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(VaultAdminBadge.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Shield, contentDescription = null, tint = VaultAdminBadge)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("ADMIN USER PROFILE", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = VaultAdminBadge, letterSpacing = 1.sp)
                            Text("@${user.username}", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = VaultTextPrimary)
                        }
                    }

                    IconButton(onClick = onDismiss, modifier = Modifier.testTag("admin_profile_close_btn")) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = VaultTextSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Account Information Section
                Card(
                    colors = CardDefaults.cardColors(containerColor = VaultSurface),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Account Details", fontWeight = FontWeight.Bold, color = VaultGold, fontSize = 14.sp)
                            StatusChip(status = user.accountStatus)
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        InfoRow("Full Name:", user.fullName)
                        InfoRow("Email Address:", user.email)
                        InfoRow("Account ID:", user.accountId)
                        InfoRow("User ID:", user.userId)
                        InfoRow("Role:", user.role)
                        InfoRow("Registration Date:", formatDate(user.registrationDate))
                        InfoRow("Last Login:", formatDate(user.lastLogin))
                        InfoRow("Referral Code:", user.referralCode)
                        InfoRow("Referred By:", user.referredByUsername ?: "Direct / None")

                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            if (user.accountStatus == "ACTIVE") {
                                OutlinedButton(
                                    onClick = { viewModel.updateTargetUserStatus(user.username, "SUSPENDED") },
                                    modifier = Modifier
                                        .weight(1f)
                                        .testTag("admin_suspend_user_btn"),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, VaultRose)
                                ) {
                                    Text("SUSPEND ACCOUNT", color = VaultRose, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            } else {
                                Button(
                                    onClick = { viewModel.updateTargetUserStatus(user.username, "ACTIVE") },
                                    modifier = Modifier
                                        .weight(1f)
                                        .testTag("admin_activate_user_btn"),
                                    colors = ButtonDefaults.buttonColors(containerColor = VaultEmerald, contentColor = Color.Black)
                                ) {
                                    Text("ACTIVATE ACCOUNT", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Financial Overview & Admin Controls
                Card(
                    colors = CardDefaults.cardColors(containerColor = VaultSurface),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Financial Summary", fontWeight = FontWeight.Bold, color = VaultGold, fontSize = 14.sp)

                            Button(
                                onClick = { showAdjustModal = true },
                                colors = ButtonDefaults.buttonColors(containerColor = VaultGold, contentColor = Color.Black),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.testTag("admin_adjust_balance_btn")
                            ) {
                                Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Adjust Balance", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        InfoRow("Current Balance:", formatCurrency(user.balance), isBold = true, textColor = VaultGold)
                        InfoRow("Total Deposits:", formatCurrency(user.totalDeposits))
                        InfoRow("Active Investments:", formatCurrency(user.totalInvestments))
                        InfoRow("Profit / Loss:", formatCurrency(user.totalProfitLoss))
                        InfoRow("Pending Withdrawals:", formatCurrency(user.pendingWithdrawals), textColor = if (user.pendingWithdrawals > 0) VaultRose else VaultTextPrimary)
                    }
                }
            }
        }
    }

    // Modal to Adjust User Balance
    if (showAdjustModal) {
        var deltaStr by remember { mutableStateOf("100") }
        var reasonStr by remember { mutableStateOf("Admin Promotional Credit") }

        AlertDialog(
            onDismissRequest = { showAdjustModal = false },
            confirmButton = {
                Button(
                    onClick = {
                        val delta = deltaStr.toDoubleOrNull() ?: 0.0
                        if (delta != 0.0) {
                            viewModel.adjustUserBalance(user.username, delta, reasonStr)
                            showAdjustModal = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = VaultGold, contentColor = Color.Black),
                    modifier = Modifier.testTag("admin_confirm_adjust_btn")
                ) {
                    Text("APPLY ADJUSTMENT", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAdjustModal = false }) {
                    Text("CANCEL", color = VaultTextSecondary)
                }
            },
            title = { Text("Adjust Balance for @${user.username}", fontWeight = FontWeight.Bold, color = VaultTextPrimary) },
            text = {
                Column {
                    Text("Enter positive value to Credit or negative to Debit:", fontSize = 12.sp, color = VaultTextSecondary)
                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = deltaStr,
                        onValueChange = { deltaStr = it },
                        label = { Text("Amount Delta (e.g. 500 or -200)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_delta_amount_input"),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = VaultGold,
                            unfocusedBorderColor = VaultBorder
                        )
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = reasonStr,
                        onValueChange = { reasonStr = it },
                        label = { Text("Reason for Adjustment") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("admin_reason_input"),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = VaultGold,
                            unfocusedBorderColor = VaultBorder
                        )
                    )
                }
            },
            containerColor = VaultSurface
        )
    }
}

@Composable
private fun InfoRow(
    label: String,
    value: String,
    isBold: Boolean = false,
    textColor: Color = VaultTextPrimary
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, color = VaultTextSecondary, fontSize = 12.sp)
        Text(
            value,
            color = textColor,
            fontSize = 12.sp,
            fontWeight = if (isBold) FontWeight.Bold else FontWeight.Medium
        )
    }
}
