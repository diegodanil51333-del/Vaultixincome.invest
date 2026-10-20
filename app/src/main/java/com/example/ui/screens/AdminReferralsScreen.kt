package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.db.InvitationEntity
import com.example.ui.VaultixViewModel
import com.example.ui.components.SectionHeader
import com.example.ui.components.StatusChip
import com.example.ui.components.formatCurrency
import com.example.ui.components.formatDate
import com.example.ui.theme.VaultBorder
import com.example.ui.theme.VaultDarkBg
import com.example.ui.theme.VaultEmerald
import com.example.ui.theme.VaultGold
import com.example.ui.theme.VaultSurface
import com.example.ui.theme.VaultTextMuted
import com.example.ui.theme.VaultTextPrimary
import com.example.ui.theme.VaultTextSecondary

@Composable
fun AdminReferralsScreen(
    viewModel: VaultixViewModel,
    modifier: Modifier = Modifier
) {
    val query by viewModel.adminReferralQuery.collectAsState()
    val invitations by viewModel.adminReferralsList.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(VaultDarkBg)
            .padding(16.dp)
    ) {
        SectionHeader(
            title = "Admin → System Referrals & Invitations",
            subtitle = "Audit log of all inviter/invitee relationships across Vaultix Income"
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = query,
            onValueChange = { viewModel.setAdminReferralQuery(it) },
            label = { Text("Search by Sender/Recipient Username, Referral Code...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = VaultGold) },
            trailingIcon = {
                if (query.isNotEmpty()) {
                    IconButton(onClick = { viewModel.setAdminReferralQuery("") }) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear", tint = VaultTextSecondary)
                    }
                }
            },
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("admin_referral_search_input"),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = VaultGold,
                unfocusedBorderColor = VaultBorder,
                focusedLabelColor = VaultGold
            )
        )

        Spacer(modifier = Modifier.height(14.dp))

        Text("Total Invitation Records: ${invitations.size}", fontSize = 12.sp, color = VaultTextMuted)

        Spacer(modifier = Modifier.height(8.dp))

        if (invitations.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(VaultSurface),
                contentAlignment = Alignment.Center
            ) {
                Text("No referral/invitation records found.", color = VaultTextMuted, fontSize = 14.sp)
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(invitations, key = { it.id }) { inv ->
                    ReferralRecordCard(invitation = inv)
                }
            }
        }
    }
}

@Composable
private fun ReferralRecordCard(invitation: InvitationEntity) {
    Card(
        colors = CardDefaults.cardColors(containerColor = VaultSurface),
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Inviter: ", color = VaultTextMuted, fontSize = 12.sp)
                    Text("@${invitation.senderUsername}", fontWeight = FontWeight.Bold, color = VaultGold, fontSize = 13.sp)
                    Text(" ➔ Recipient: ", color = VaultTextMuted, fontSize = 12.sp)
                    Text("@${invitation.recipientUsername}", fontWeight = FontWeight.Bold, color = VaultTextPrimary, fontSize = 13.sp)
                }

                StatusChip(status = invitation.status)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Code: ${invitation.referralCode} | ID: ${invitation.invitationId}", color = VaultTextMuted, fontSize = 11.sp)
                Text(formatDate(invitation.createdDate), color = VaultTextMuted, fontSize = 11.sp)
            }
        }
    }
}
