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
import androidx.compose.material.icons.filled.AutoGraph
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Diamond
import androidx.compose.material.icons.filled.RocketLaunch
import androidx.compose.material.icons.filled.ShieldMoon
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.db.InvestmentEntity
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
import com.example.ui.theme.VaultSurface
import com.example.ui.theme.VaultSurfaceVariant
import com.example.ui.theme.VaultTextMuted
import com.example.ui.theme.VaultTextPrimary
import com.example.ui.theme.VaultTextSecondary

data class VaultPlan(
    val name: String,
    val dailyPercentage: Double,
    val durationDays: Int,
    val minAmount: Double,
    val icon: ImageVector,
    val color: Color
)

@Composable
fun InvestmentsScreen(
    viewModel: VaultixViewModel,
    modifier: Modifier = Modifier
) {
    val currentUser by viewModel.currentUser.collectAsState()
    val activeInvestments by viewModel.userInvestments.collectAsState()

    var selectedPlanForInvest by remember { mutableStateOf<VaultPlan?>(null) }

    val user = currentUser ?: return

    val availablePlans = remember {
        listOf(
            VaultPlan(
                name = "Vaultix Starter Yield",
                dailyPercentage = 1.5,
                durationDays = 30,
                minAmount = 100.0,
                icon = Icons.Default.AutoGraph,
                color = VaultCyan
            ),
            VaultPlan(
                name = "Crypto Growth Staking",
                dailyPercentage = 2.2,
                durationDays = 45,
                minAmount = 500.0,
                icon = Icons.Default.RocketLaunch,
                color = VaultEmerald
            ),
            VaultPlan(
                name = "VIP Alpha Real Estate Vault",
                dailyPercentage = 3.5,
                durationDays = 60,
                minAmount = 2000.0,
                icon = Icons.Default.Diamond,
                color = VaultGold
            )
        )
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(VaultDarkBg)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        SectionHeader(
            title = "Investment Vaults",
            subtitle = "High-yield automated digital asset compounding strategies"
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Plan Cards
        availablePlans.forEach { plan ->
            Card(
                colors = CardDefaults.cardColors(containerColor = VaultSurface),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, plan.color.copy(alpha = 0.4f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
                    .testTag("plan_card_${plan.name}")
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(plan.color.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(plan.icon, contentDescription = null, tint = plan.color)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(plan.name, fontWeight = FontWeight.Bold, color = VaultTextPrimary, fontSize = 15.sp)
                                Text("Min Deposit: ${formatCurrency(plan.minAmount)}", color = VaultTextSecondary, fontSize = 12.sp)
                            }
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(plan.color.copy(alpha = 0.15f))
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text("${plan.dailyPercentage}% / day", color = plan.color, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Duration: ${plan.durationDays} Days", color = VaultTextMuted, fontSize = 12.sp)

                        Button(
                            onClick = { selectedPlanForInvest = plan },
                            colors = ButtonDefaults.buttonColors(containerColor = plan.color, contentColor = Color.Black),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("INVEST NOW", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Active Investments Section
        SectionHeader(
            title = "My Active Investments",
            subtitle = "Your running vault investments & earned yields"
        )

        Spacer(modifier = Modifier.height(10.dp))

        if (activeInvestments.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(VaultSurface)
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("No active investments yet. Choose a vault above to start earning.", color = VaultTextMuted, fontSize = 13.sp)
            }
        } else {
            activeInvestments.forEach { inv ->
                ActiveInvestmentCard(investment = inv)
            }
        }
    }

    // Modal Dialog to Confirm Investment Amount
    selectedPlanForInvest?.let { plan ->
        InvestDialog(
            plan = plan,
            userBalance = user.balance,
            onDismiss = { selectedPlanForInvest = null },
            onConfirm = { amount ->
                viewModel.createInvestment(plan.name, amount, plan.dailyPercentage, plan.durationDays)
                selectedPlanForInvest = null
            }
        )
    }
}

@Composable
private fun ActiveInvestmentCard(investment: InvestmentEntity) {
    Card(
        colors = CardDefaults.cardColors(containerColor = VaultSurface),
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 10.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(investment.planName, fontWeight = FontWeight.Bold, color = VaultTextPrimary, fontSize = 14.sp)
                    Text("Started: ${formatDate(investment.startDate)}", color = VaultTextMuted, fontSize = 11.sp)
                }
                StatusChip(status = investment.status)
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Principal", color = VaultTextMuted, fontSize = 11.sp)
                    Text(formatCurrency(investment.principalAmount), fontWeight = FontWeight.Bold, color = VaultTextPrimary, fontSize = 14.sp)
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text("Total Earned Yield", color = VaultTextMuted, fontSize = 11.sp)
                    Text("+${formatCurrency(investment.earnedAmount)}", fontWeight = FontWeight.Bold, color = VaultEmerald, fontSize = 14.sp)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            LinearProgressIndicator(
                progress = { 0.4f },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = VaultEmerald,
                trackColor = VaultSurfaceVariant,
            )
        }
    }
}

@Composable
private fun InvestDialog(
    plan: VaultPlan,
    userBalance: Double,
    onDismiss: () -> Unit,
    onConfirm: (Double) -> Unit
) {
    var amountText by remember { mutableStateOf(plan.minAmount.toInt().toString()) }
    var errorMsg by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = {
                    val amt = amountText.toDoubleOrNull()
                    if (amt == null || amt < plan.minAmount) {
                        errorMsg = "Minimum investment for this plan is ${formatCurrency(plan.minAmount)}"
                    } else if (amt > userBalance) {
                        errorMsg = "Insufficient balance. Available: ${formatCurrency(userBalance)}"
                    } else {
                        onConfirm(amt)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = plan.color, contentColor = Color.Black)
            ) {
                Text("CONFIRM INVESTMENT", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("CANCEL", color = VaultTextSecondary)
            }
        },
        title = {
            Text("Invest in ${plan.name}", fontWeight = FontWeight.Bold, color = VaultTextPrimary)
        },
        text = {
            Column {
                Text(
                    text = "Daily ROI: ${plan.dailyPercentage}% | Duration: ${plan.durationDays} Days",
                    color = VaultTextSecondary,
                    fontSize = 12.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Available Balance: ${formatCurrency(userBalance)}",
                    color = VaultGold,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = amountText,
                    onValueChange = {
                        amountText = it
                        errorMsg = null
                    },
                    label = { Text("Amount (USD)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = VaultGold,
                        unfocusedBorderColor = VaultBorder
                    )
                )

                errorMsg?.let { err ->
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(err, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
                }
            }
        },
        containerColor = VaultSurface
    )
}
