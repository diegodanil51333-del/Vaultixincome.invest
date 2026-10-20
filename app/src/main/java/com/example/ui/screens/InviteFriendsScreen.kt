package com.example.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.GroupAdd
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.IconButton
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.db.UserEntity
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
import kotlinx.coroutines.launch

@Composable
fun InviteFriendsScreen(
    viewModel: VaultixViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val currentUser by viewModel.currentUser.collectAsState()
    val sentInvitations by viewModel.userSentInvitations.collectAsState()
    val referredAccounts by viewModel.userReferredAccounts.collectAsState()

    val uiMessage by viewModel.uiMessage.collectAsState()
    val uiError by viewModel.uiError.collectAsState()

    var targetUsernameInput by remember { mutableStateOf("") }
    var userCheckStatus by remember { mutableStateOf<String?>(null) }
    var isUserCheckValid by remember { mutableStateOf(false) }

    val user = currentUser ?: return
    val refLink = "https://vaultix.income/invite?ref=${user.referralCode}"

    fun copyToClipboard(text: String, label: String) {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val clip = ClipData.newPlainText(label, text)
        clipboard.setPrimaryClip(clip)
        Toast.makeText(context, "$label copied to clipboard!", Toast.LENGTH_SHORT).show()
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(VaultDarkBg)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        SectionHeader(
            title = "Invite Friends & Earn Rewards",
            subtitle = "Earn $25 bonus for every friend who registers using your link or username"
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Feedback banners
        AnimatedVisibility(visible = uiError != null) {
            uiError?.let { err ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(VaultRose.copy(alpha = 0.15f))
                        .border(1.dp, VaultRose, RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Text(text = err, color = VaultRose, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                }
            }
        }

        AnimatedVisibility(visible = uiMessage != null) {
            uiMessage?.let { msg ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(VaultEmerald.copy(alpha = 0.15f))
                        .border(1.dp, VaultEmerald, RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Text(text = msg, color = VaultEmerald, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                }
            }
        }

        // Referral Code & Link Card
        Card(
            colors = CardDefaults.cardColors(containerColor = VaultSurface),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, VaultGold.copy(alpha = 0.5f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "YOUR UNIQUE REFERRAL CODE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = VaultTextMuted,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = user.referralCode,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = VaultGold
                    )

                    Button(
                        onClick = { copyToClipboard(user.referralCode, "Referral Code") },
                        colors = ButtonDefaults.buttonColors(containerColor = VaultGold, contentColor = Color.Black),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.testTag("copy_ref_code_btn")
                    ) {
                        Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Copy Code", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "YOUR INVITATION LINK",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = VaultTextMuted,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(VaultSurfaceVariant)
                        .border(1.dp, VaultBorder, RoundedCornerShape(8.dp))
                        .padding(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = refLink,
                            fontSize = 12.sp,
                            color = VaultCyan,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(
                            onClick = { copyToClipboard(refLink, "Invitation Link") },
                            modifier = Modifier.testTag("copy_ref_link_btn")
                        ) {
                            Icon(Icons.Default.ContentCopy, contentDescription = "Copy link", tint = VaultGold)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // INVITE VIA USERNAME CARD
        Card(
            colors = CardDefaults.cardColors(containerColor = VaultSurface),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Person, contentDescription = null, tint = VaultEmerald)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Send Direct Invitation by Username",
                        fontWeight = FontWeight.Bold,
                        color = VaultTextPrimary,
                        fontSize = 15.sp
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = targetUsernameInput,
                    onValueChange = {
                        targetUsernameInput = it
                        userCheckStatus = null
                        isUserCheckValid = false
                    },
                    label = { Text("Recipient's Vaultix Username") },
                    leadingIcon = { Icon(Icons.Default.GroupAdd, contentDescription = null, tint = VaultGold) },
                    trailingIcon = {
                        Button(
                            onClick = {
                                val query = targetUsernameInput.trim()
                                if (query.equals(user.username, ignoreCase = true)) {
                                    userCheckStatus = "Cannot invite yourself."
                                    isUserCheckValid = false
                                } else {
                                    scope.launch {
                                        val match = viewModel.repository.getUserByUsername(query)
                                        if (match != null) {
                                            userCheckStatus = "Valid Account: @${match.username}"
                                            isUserCheckValid = true
                                        } else {
                                            userCheckStatus = "User '$query' does not exist."
                                            isUserCheckValid = false
                                        }
                                    }
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = VaultGold, contentColor = Color.Black),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier
                                .padding(end = 6.dp)
                                .testTag("verify_username_btn")
                        ) {
                            Text("Check", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("invite_username_input"),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = VaultGold,
                        unfocusedBorderColor = VaultBorder,
                        focusedLabelColor = VaultGold
                    )
                )

                // Validation Status Output
                userCheckStatus?.let { status ->
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = if (isUserCheckValid) Icons.Default.CheckCircle else Icons.Default.Error,
                            contentDescription = null,
                            tint = if (isUserCheckValid) VaultEmerald else VaultRose,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = status,
                            color = if (isUserCheckValid) VaultEmerald else VaultRose,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Button(
                    onClick = {
                        if (targetUsernameInput.isNotEmpty()) {
                            viewModel.sendInvitation(targetUsernameInput)
                            targetUsernameInput = ""
                            userCheckStatus = null
                            isUserCheckValid = false
                        }
                    },
                    enabled = isUserCheckValid,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                        .testTag("send_invite_submit_btn"),
                    colors = ButtonDefaults.buttonColors(containerColor = VaultEmerald, contentColor = Color.Black),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("SEND INVITATION RECORD", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // REFERRAL DASHBOARD STATS
        SectionHeader(title = "Referral Dashboard", subtitle = "Tracking your referral invites & rewards")

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                title = "Total Referred",
                value = "${referredAccounts.size}",
                icon = Icons.Default.Group,
                iconColor = VaultCyan,
                modifier = Modifier.weight(1f),
                testTag = "stat_total_referred"
            )
            StatCard(
                title = "Earned Rewards",
                value = formatCurrency(referredAccounts.size * 25.0),
                icon = Icons.Default.MonetizationOn,
                iconColor = VaultGold,
                modifier = Modifier.weight(1f),
                testTag = "stat_earned_rewards"
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // REFERRED ACCOUNTS LIST
        SectionHeader(title = "Registered Referrals", subtitle = "Users who registered using your referral code/link")

        Spacer(modifier = Modifier.height(10.dp))

        if (referredAccounts.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(VaultSurface)
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("No referred users registered yet.", color = VaultTextMuted, fontSize = 13.sp)
            }
        } else {
            referredAccounts.forEach { referredUser ->
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
                            Text("@${referredUser.username}", fontWeight = FontWeight.Bold, color = VaultTextPrimary, fontSize = 14.sp)
                            Text("Account ID: ${referredUser.accountId}", color = VaultTextMuted, fontSize = 11.sp)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("+$25.00 Reward", fontWeight = FontWeight.Bold, color = VaultEmerald, fontSize = 13.sp)
                            Text(formatDate(referredUser.registrationDate), color = VaultTextMuted, fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // SENT INVITATIONS LIST
        SectionHeader(title = "Sent Invitations", subtitle = "Invitations issued by you to other usernames")

        Spacer(modifier = Modifier.height(10.dp))

        if (sentInvitations.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(VaultSurface)
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("No direct invitations sent yet.", color = VaultTextMuted, fontSize = 13.sp)
            }
        } else {
            sentInvitations.forEach { inv ->
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
                            Text("Invited: @${inv.recipientUsername}", fontWeight = FontWeight.Bold, color = VaultTextPrimary, fontSize = 14.sp)
                            Text("Inv ID: ${inv.invitationId}", color = VaultTextMuted, fontSize = 11.sp)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            StatusChip(status = inv.status)
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(formatDate(inv.createdDate), color = VaultTextMuted, fontSize = 11.sp)
                        }
                    }
                }
            }
        }
    }
}
