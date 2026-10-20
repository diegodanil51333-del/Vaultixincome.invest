package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AlternateEmail
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.ui.VaultixViewModel
import com.example.ui.theme.VaultBorder
import com.example.ui.theme.VaultDarkBg
import com.example.ui.theme.VaultEmerald
import com.example.ui.theme.VaultGold
import com.example.ui.theme.VaultRose
import com.example.ui.theme.VaultSurface
import com.example.ui.theme.VaultTextMuted
import com.example.ui.theme.VaultTextPrimary
import com.example.ui.theme.VaultTextSecondary

@Composable
fun AuthScreen(
    viewModel: VaultixViewModel,
    modifier: Modifier = Modifier
) {
    var selectedTab by remember { mutableIntStateOf(0) } // 0: Login, 1: Register

    val uiError by viewModel.uiError.collectAsState()
    val uiMessage by viewModel.uiMessage.collectAsState()

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(VaultDarkBg)
            .padding(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Brand Logo & Header
            Image(
                painter = painterResource(id = R.drawable.vaultix_icon_1791110685486),
                contentDescription = "Vaultix Income Brand Logo",
                modifier = Modifier
                    .size(96.dp)
                    .clip(CircleShape)
                    .border(2.dp, VaultGold.copy(alpha = 0.6f), CircleShape)
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "VAULTIX INCOME",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = VaultGold,
                letterSpacing = 2.sp
            )
            Text(
                text = "Digital Asset Management & Wealth Platform",
                fontSize = 12.sp,
                color = VaultTextSecondary
            )

            Spacer(modifier = Modifier.height(24.dp))

            Card(
                colors = CardDefaults.cardColors(containerColor = VaultSurface),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, VaultBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    // Tab Switcher
                    TabRow(
                        selectedTabIndex = selectedTab,
                        containerColor = Color.Transparent,
                        contentColor = VaultGold,
                        indicator = { tabPositions ->
                            TabRowDefaults.SecondaryIndicator(
                                modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                                color = VaultGold
                            )
                        }
                    ) {
                        Tab(
                            selected = selectedTab == 0,
                            onClick = { selectedTab = 0; viewModel.clearUiMessages() },
                            text = { Text("LOG IN", fontWeight = FontWeight.Bold) }
                        )
                        Tab(
                            selected = selectedTab == 1,
                            onClick = { selectedTab = 1; viewModel.clearUiMessages() },
                            text = { Text("REGISTER", fontWeight = FontWeight.Bold) }
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Error Alert Banner
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
                                Text(
                                    text = err,
                                    color = VaultRose,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }

                    // Success Alert Banner
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
                                Text(
                                    text = msg,
                                    color = VaultEmerald,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }

                    if (selectedTab == 0) {
                        LoginForm(onLogin = { userOrEmail, pass ->
                            viewModel.login(userOrEmail, pass)
                        })
                    } else {
                        RegisterForm(onRegister = { user, name, email, pass, passConf, ref ->
                            viewModel.register(user, name, email, pass, passConf, ref)
                        })
                    }
                }
            }
        }
    }
}

@Composable
private fun LoginForm(
    onLogin: (String, String) -> Unit
) {
    var usernameOrEmail by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    Column {
        OutlinedTextField(
            value = usernameOrEmail,
            onValueChange = { usernameOrEmail = it },
            label = { Text("Username or Email") },
            leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = VaultGold) },
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("login_username_input"),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = VaultGold,
                unfocusedBorderColor = VaultBorder,
                focusedLabelColor = VaultGold,
                unfocusedLabelColor = VaultTextSecondary
            )
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = VaultGold) },
            trailingIcon = {
                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Icon(
                        imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                        contentDescription = "Toggle password visibility",
                        tint = VaultTextSecondary
                    )
                }
            },
            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("login_password_input"),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = VaultGold,
                unfocusedBorderColor = VaultBorder,
                focusedLabelColor = VaultGold,
                unfocusedLabelColor = VaultTextSecondary
            )
        )

        Spacer(modifier = Modifier.height(20.dp))

        Button(
            onClick = { onLogin(usernameOrEmail, password) },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .testTag("login_submit_button"),
            colors = ButtonDefaults.buttonColors(containerColor = VaultGold, contentColor = Color.Black),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text("SECURE LOGIN", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        }
    }
}

@Composable
private fun RegisterForm(
    onRegister: (String, String, String, String, String, String?) -> Unit
) {
    var username by remember { mutableStateOf("") }
    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordConfirm by remember { mutableStateOf("") }
    var referralCode by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    Column {
        OutlinedTextField(
            value = username,
            onValueChange = { username = it },
            label = { Text("Username (Unique ID)") },
            leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = VaultGold) },
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("register_username_input"),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = VaultGold,
                unfocusedBorderColor = VaultBorder,
                focusedLabelColor = VaultGold
            )
        )

        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
            value = fullName,
            onValueChange = { fullName = it },
            label = { Text("Full Name") },
            leadingIcon = { Icon(Icons.Default.Badge, contentDescription = null, tint = VaultGold) },
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("register_fullname_input"),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = VaultGold,
                unfocusedBorderColor = VaultBorder,
                focusedLabelColor = VaultGold
            )
        )

        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email Address") },
            leadingIcon = { Icon(Icons.Default.AlternateEmail, contentDescription = null, tint = VaultGold) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("register_email_input"),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = VaultGold,
                unfocusedBorderColor = VaultBorder,
                focusedLabelColor = VaultGold
            )
        )

        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password (Min 6 chars)") },
            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = VaultGold) },
            trailingIcon = {
                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Icon(
                        imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                        contentDescription = "Toggle password visibility",
                        tint = VaultTextSecondary
                    )
                }
            },
            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("register_password_input"),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = VaultGold,
                unfocusedBorderColor = VaultBorder,
                focusedLabelColor = VaultGold
            )
        )

        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
            value = passwordConfirm,
            onValueChange = { passwordConfirm = it },
            label = { Text("Confirm Password") },
            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = VaultGold) },
            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("register_password_confirm_input"),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = VaultGold,
                unfocusedBorderColor = VaultBorder,
                focusedLabelColor = VaultGold
            )
        )

        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
            value = referralCode,
            onValueChange = { referralCode = it },
            label = { Text("Referral Code or Inviter Username (Optional)") },
            leadingIcon = { Icon(Icons.Default.PersonAdd, contentDescription = null, tint = VaultEmerald) },
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("register_referral_input"),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = VaultEmerald,
                unfocusedBorderColor = VaultBorder,
                focusedLabelColor = VaultEmerald
            )
        )

        Spacer(modifier = Modifier.height(20.dp))

        Button(
            onClick = {
                onRegister(username, fullName, email, password, passwordConfirm, referralCode.ifEmpty { null })
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .testTag("register_submit_button"),
            colors = ButtonDefaults.buttonColors(containerColor = VaultGold, contentColor = Color.Black),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text("CREATE VAULTIX ACCOUNT", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        }
    }
}
