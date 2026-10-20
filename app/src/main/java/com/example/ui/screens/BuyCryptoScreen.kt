package com.example.ui.screens

import android.content.Intent
import android.net.Uri
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
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.CurrencyBitcoin
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import com.example.ui.theme.VaultRose
import com.example.ui.theme.VaultSurface
import com.example.ui.theme.VaultSurfaceVariant
import com.example.ui.theme.VaultTextMuted
import com.example.ui.theme.VaultTextPrimary
import com.example.ui.theme.VaultTextSecondary

data class CryptoProvider(
    val name: String,
    val regions: List<String>,
    val paymentMethods: List<String>,
    val supportedCryptos: List<String>,
    val websiteUrl: String,
    val tagLine: String
)

@Composable
fun BuyCryptoScreen(
    viewModel: VaultixViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var selectedCountry by remember { mutableStateOf("United States") }

    val countries = remember {
        listOf("United States", "United Kingdom", "European Union", "Canada", "Australia", "Global / Other")
    }

    val allProviders = remember {
        listOf(
            CryptoProvider(
                name = "MoonPay",
                regions = listOf("United States", "United Kingdom", "European Union", "Canada", "Australia", "Global / Other"),
                paymentMethods = listOf("ACH / Wire Transfer", "Credit & Debit Cards", "Apple Pay", "SEPA Instant"),
                supportedCryptos = listOf("BTC", "ETH", "USDT", "SOL", "USDC"),
                websiteUrl = "https://www.moonpay.com/buy",
                tagLine = "Regulated Global On-Ramp Gateway"
            ),
            CryptoProvider(
                name = "Banxa",
                regions = listOf("United States", "United Kingdom", "European Union", "Canada", "Australia", "Global / Other"),
                paymentMethods = listOf("Wire Transfer", "Interac (Canada)", "POLi (Australia)", "Visa/Mastercard"),
                supportedCryptos = listOf("BTC", "ETH", "USDT", "USDC"),
                websiteUrl = "https://banxa.com",
                tagLine = "Compliant Multi-Currency Payment Infrastructure"
            ),
            CryptoProvider(
                name = "Ramp Network",
                regions = listOf("United Kingdom", "European Union", "United States", "Global / Other"),
                paymentMethods = listOf("Instant Electronic", "SEPA Instant", "Credit Card", "Pix"),
                supportedCryptos = listOf("BTC", "ETH", "USDT", "MATIC"),
                websiteUrl = "https://ramp.network/buy",
                tagLine = "Non-Custodial Instant Crypto Exchange"
            ),
            CryptoProvider(
                name = "Coinbase Pay",
                regions = listOf("United States", "United Kingdom", "European Union", "Canada", "Global / Other"),
                paymentMethods = listOf("ACH Transfer", "Direct Wire", "Debit Card"),
                supportedCryptos = listOf("BTC", "ETH", "USDT", "SOL", "ADA"),
                websiteUrl = "https://www.coinbase.com/buy-crypto",
                tagLine = "Licensed U.S. Regulated Brokerage On-Ramp"
            )
        )
    }

    val filteredProviders = remember(selectedCountry) {
        allProviders.filter { provider ->
            provider.regions.contains(selectedCountry) || provider.regions.contains("Global / Other")
        }
    }

    fun openProviderUrl(url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        context.startActivity(intent)
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(VaultDarkBg)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        SectionHeader(
            title = "Buy Crypto via Verified Providers",
            subtitle = "Regulated third-party fiat-to-crypto gateways for your jurisdiction"
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Country Selector Card
        Card(
            colors = CardDefaults.cardColors(containerColor = VaultSurface),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Public, contentDescription = null, tint = VaultCyan)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Select Your Residence Country / Region:", fontWeight = FontWeight.Bold, color = VaultTextPrimary, fontSize = 13.sp)
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    countries.take(3).forEach { country ->
                        val isSelected = selectedCountry == country
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isSelected) VaultCyan.copy(alpha = 0.25f) else VaultSurfaceVariant)
                                .border(1.dp, if (isSelected) VaultCyan else VaultBorder, RoundedCornerShape(8.dp))
                                .clickable { selectedCountry = country }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = country,
                                fontSize = 11.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) VaultCyan else VaultTextPrimary
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    countries.drop(3).forEach { country ->
                        val isSelected = selectedCountry == country
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isSelected) VaultCyan.copy(alpha = 0.25f) else VaultSurfaceVariant)
                                .border(1.dp, if (isSelected) VaultCyan else VaultBorder, RoundedCornerShape(8.dp))
                                .clickable { selectedCountry = country }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = country,
                                fontSize = 11.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) VaultCyan else VaultTextPrimary
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Mandatory External Provider Disclaimer Banner
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(VaultGold.copy(alpha = 0.12f))
                .border(1.dp, VaultGold.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                .padding(14.dp)
        ) {
            Row(verticalAlignment = Alignment.Top) {
                Icon(Icons.Default.Info, contentDescription = null, tint = VaultGold, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text("Third-Party Provider Disclaimer", fontWeight = FontWeight.Bold, color = VaultGold, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "Crypto purchases are completed through the selected third-party provider. Vaultix Income does not control the provider’s pricing, verification, availability, fees, or transaction processing.",
                        color = VaultTextSecondary,
                        fontSize = 11.sp,
                        lineHeight = 15.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(18.dp))

        Text(
            text = "Verified Providers Available in $selectedCountry (${filteredProviders.size})",
            fontWeight = FontWeight.Bold,
            color = VaultTextPrimary,
            fontSize = 14.sp
        )

        Spacer(modifier = Modifier.height(10.dp))

        filteredProviders.forEach { provider ->
            Card(
                colors = CardDefaults.cardColors(containerColor = VaultSurface),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
                    .testTag("crypto_provider_${provider.name}")
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(VaultEmerald.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.VerifiedUser, contentDescription = null, tint = VaultEmerald)
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column {
                                Text(provider.name, fontWeight = FontWeight.Bold, color = VaultTextPrimary, fontSize = 16.sp)
                                Text(provider.tagLine, color = VaultTextMuted, fontSize = 11.sp)
                            }
                        }

                        Button(
                            onClick = { openProviderUrl(provider.websiteUrl) },
                            colors = ButtonDefaults.buttonColors(containerColor = VaultEmerald, contentColor = Color.Black),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.testTag("buy_crypto_btn_${provider.name}")
                        ) {
                            Text("Buy Crypto", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.Default.OpenInNew, contentDescription = null, modifier = Modifier.size(14.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Supported Payment Methods:", color = VaultTextMuted, fontSize = 11.sp)
                            Text(provider.paymentMethods.joinToString(", "), color = VaultTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column(horizontalAlignment = Alignment.End) {
                            Text("Supported Assets:", color = VaultTextMuted, fontSize = 11.sp)
                            Text(provider.supportedCryptos.joinToString(" • "), color = VaultGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
