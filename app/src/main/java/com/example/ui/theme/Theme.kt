package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val VaultixColorScheme = darkColorScheme(
    primary = VaultGold,
    onPrimary = Color.Black,
    primaryContainer = VaultSurfaceVariant,
    onPrimaryContainer = VaultGoldLight,
    secondary = VaultEmerald,
    onSecondary = Color.Black,
    secondaryContainer = VaultSurfaceVariant,
    onSecondaryContainer = VaultEmeraldLight,
    tertiary = VaultCyan,
    background = VaultDarkBg,
    onBackground = VaultTextPrimary,
    surface = VaultSurface,
    onSurface = VaultTextPrimary,
    surfaceVariant = VaultSurfaceVariant,
    onSurfaceVariant = VaultTextSecondary,
    outline = VaultBorder,
    error = VaultRose,
    onError = Color.White
)

@Composable
fun VaultixTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = VaultixColorScheme,
        typography = Typography,
        content = content
    )
}

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    VaultixTheme(content = content)
}
