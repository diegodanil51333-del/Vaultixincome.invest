package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Shield
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
import com.example.ui.theme.VaultSurface
import com.example.ui.theme.VaultTextMuted
import com.example.ui.theme.VaultTextPrimary
import com.example.ui.theme.VaultTextSecondary

@Composable
fun AdminUsersScreen(
    viewModel: VaultixViewModel,
    modifier: Modifier = Modifier
) {
    val searchQuery by viewModel.adminSearchQuery.collectAsState()
    val usersList by viewModel.adminUsersList.collectAsState()
    val selectedUser by viewModel.selectedAdminUser.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(VaultDarkBg)
            .padding(16.dp)
    ) {
        SectionHeader(
            title = "Admin → User Directory",
            subtitle = "Real-time query & management across all registered platform accounts"
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Live Search TextField
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { viewModel.setAdminSearchQuery(it) },
            label = { Text("Search by Username, Email, Account ID, User ID, Name...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = VaultGold) },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(onClick = { viewModel.setAdminSearchQuery("") }) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear search", tint = VaultTextSecondary)
                    }
                }
            },
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("admin_user_search_input"),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = VaultGold,
                unfocusedBorderColor = VaultBorder,
                focusedLabelColor = VaultGold
            )
        )

        Spacer(modifier = Modifier.height(14.dp))

        Text(
            text = "Found ${usersList.size} User Accounts",
            fontSize = 12.sp,
            color = VaultTextMuted,
            fontWeight = FontWeight.Medium
        )

        Spacer(modifier = Modifier.height(8.dp))

        if (usersList.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(VaultSurface),
                contentAlignment = Alignment.Center
            ) {
                Text("No matching users found.", color = VaultTextMuted, fontSize = 14.sp)
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(usersList, key = { it.id }) { user ->
                    UserRowCard(
                        user = user,
                        onClick = { viewModel.selectAdminUser(user) }
                    )
                }
            }
        }
    }

    // Modal Profile Detail Dialog
    selectedUser?.let { user ->
        AdminUserProfileDialog(
            user = user,
            viewModel = viewModel,
            onDismiss = { viewModel.selectAdminUser(null) }
        )
    }
}

@Composable
private fun UserRowCard(
    user: UserEntity,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = VaultSurface),
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .testTag("user_row_${user.username}")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(if (user.role == "ADMIN") VaultAdminBadge.copy(alpha = 0.2f) else VaultGold.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (user.role == "ADMIN") Icons.Default.Shield else Icons.Default.Person,
                    contentDescription = null,
                    tint = if (user.role == "ADMIN") VaultAdminBadge else VaultGold
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("@${user.username}", fontWeight = FontWeight.Bold, color = VaultTextPrimary, fontSize = 14.sp)
                    Spacer(modifier = Modifier.width(6.dp))
                    StatusChip(status = user.accountStatus)
                }
                Spacer(modifier = Modifier.height(2.dp))
                Text("${user.fullName} • ${user.email}", color = VaultTextSecondary, fontSize = 11.sp)
                Text("Acc: ${user.accountId} | ID: ${user.userId}", color = VaultTextMuted, fontSize = 10.sp)
            }

            Spacer(modifier = Modifier.width(8.dp))

            Column(horizontalAlignment = Alignment.End) {
                Text(formatCurrency(user.balance), fontWeight = FontWeight.Bold, color = VaultGold, fontSize = 14.sp)
                Text("Reg: ${formatDate(user.registrationDate).take(12)}", color = VaultTextMuted, fontSize = 10.sp)
            }

            Icon(Icons.Default.ChevronRight, contentDescription = "Open profile", tint = VaultTextMuted)
        }
    }
}
