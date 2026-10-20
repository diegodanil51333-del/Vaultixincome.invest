package com.example.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AlternateEmail
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.MailOutline
import androidx.compose.material.icons.filled.QuestionAnswer
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.VaultixViewModel
import com.example.ui.components.SectionHeader
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

const val OFFICIAL_SUPPORT_EMAIL = "Vaultixincometeam@outlook.com"

@Composable
fun SupportScreen(
    viewModel: VaultixViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val currentUser by viewModel.currentUser.collectAsState()
    val user = currentUser ?: return

    var selectedCategory by remember { mutableStateOf("General Support Inquiry") }
    var issueMessage by remember { mutableStateOf("") }

    val categories = remember {
        listOf(
            "Wallet & Deposits",
            "Withdrawal Request",
            "Investment Vaults",
            "Referral & Rewards",
            "General Support Inquiry"
        )
    }

    fun launchEmailClient() {
        val subject = "Vaultix Income Support Request - $selectedCategory"
        val bodyText = """
            Support Category: $selectedCategory
            Username: @${user.username}
            Account ID: ${user.accountId}
            
            Issue Description:
            ${issueMessage.ifEmpty { "[Please describe your issue here]" }}
            
            -------------------------------------
            Sent from Vaultix Income Client Application
        """.trimIndent()

        val uriText = "mailto:$OFFICIAL_SUPPORT_EMAIL" +
                "?subject=" + Uri.encode(subject) +
                "&body=" + Uri.encode(bodyText)

        val intent = Intent(Intent.ACTION_SENDTO, Uri.parse(uriText))
        try {
            context.startActivity(Intent.createChooser(intent, "Send Email via..."))
        } catch (e: Exception) {
            // Fallback clipboard copy
            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("Support Email", OFFICIAL_SUPPORT_EMAIL)
            clipboard.setPrimaryClip(clip)
            Toast.makeText(context, "Copied support email to clipboard: $OFFICIAL_SUPPORT_EMAIL", Toast.LENGTH_LONG).show()
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(VaultDarkBg)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        SectionHeader(
            title = "Official Client Support",
            subtitle = "Direct encrypted inquiries to Vaultix Income Customer Operations"
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Official Contact Banner Card
        Card(
            colors = CardDefaults.cardColors(containerColor = VaultSurface),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, VaultGold.copy(alpha = 0.5f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(VaultGold.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.SupportAgent, contentDescription = null, tint = VaultGold, modifier = Modifier.size(28.dp))
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column {
                        Text("24/7 Official Support Channel", fontWeight = FontWeight.Bold, color = VaultTextPrimary, fontSize = 15.sp)
                        Text(OFFICIAL_SUPPORT_EMAIL, fontWeight = FontWeight.Bold, color = VaultGold, fontSize = 13.sp)
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = { launchEmailClient() },
                        modifier = Modifier
                            .weight(1f)
                            .height(42.dp)
                            .testTag("launch_email_support_btn"),
                        colors = ButtonDefaults.buttonColors(containerColor = VaultGold, contentColor = Color.Black),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.MailOutline, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("OPEN EMAIL APP", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }

                    OutlinedButton(
                        onClick = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            val clip = ClipData.newPlainText("Support Email", OFFICIAL_SUPPORT_EMAIL)
                            clipboard.setPrimaryClip(clip)
                            Toast.makeText(context, "Support email copied to clipboard!", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(42.dp)
                            .testTag("copy_support_email_btn"),
                        border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.ContentCopy, contentDescription = null, tint = VaultTextPrimary, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("COPY EMAIL", color = VaultTextPrimary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Support Category Form
        Card(
            colors = CardDefaults.cardColors(containerColor = VaultSurface),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Select Support Issue Category:", fontWeight = FontWeight.Bold, color = VaultTextPrimary, fontSize = 13.sp)
                Spacer(modifier = Modifier.height(8.dp))

                categories.forEach { cat ->
                    val isSelected = selectedCategory == cat
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 6.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isSelected) VaultGold.copy(alpha = 0.2f) else VaultSurfaceVariant)
                            .border(1.dp, if (isSelected) VaultGold else VaultBorder, RoundedCornerShape(8.dp))
                            .clickable { selectedCategory = cat }
                            .padding(12.dp)
                    ) {
                        Text(
                            text = cat,
                            color = if (isSelected) VaultGold else VaultTextPrimary,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            fontSize = 13.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = issueMessage,
                    onValueChange = { issueMessage = it },
                    label = { Text("Details or Questions (Optional)") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(110.dp)
                        .testTag("support_message_input"),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = VaultGold,
                        unfocusedBorderColor = VaultBorder,
                        focusedLabelColor = VaultGold
                    )
                )

                Spacer(modifier = Modifier.height(14.dp))

                Button(
                    onClick = { launchEmailClient() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp)
                        .testTag("submit_support_ticket_btn"),
                    colors = ButtonDefaults.buttonColors(containerColor = VaultEmerald, contentColor = Color.Black),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("SEND EMAIL TO SUPPORT TEAM", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Frequently Asked Questions
        SectionHeader(title = "Knowledge Base & FAQs", subtitle = "Common platform operations and security guidance")

        Spacer(modifier = Modifier.height(10.dp))

        FaqItem(
            question = "How are referral bonus rewards credited?",
            answer = "When a friend registers using your unique referral link or username, a $25 USD bonus is automatically deposited into your portfolio balance and recorded in your transaction ledger."
        )

        FaqItem(
            question = "How do investment vaults earn daily interest?",
            answer = "Vaultix automated trading strategies run on 24-hour compounding cycles. Returns are credited directly to your liquid account balance daily."
        )

        FaqItem(
            question = "Is my account secured with MFA?",
            answer = "Yes, all administrator operations and user transactions are protected with server-side role validation and cryptographic database indexing."
        )
    }
}

@Composable
private fun FaqItem(question: String, answer: String) {
    Card(
        colors = CardDefaults.cardColors(containerColor = VaultSurface),
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.QuestionAnswer, contentDescription = null, tint = VaultCyan, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(question, fontWeight = FontWeight.Bold, color = VaultTextPrimary, fontSize = 13.sp)
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(answer, color = VaultTextSecondary, fontSize = 12.sp, lineHeight = 16.sp)
        }
    }
}
