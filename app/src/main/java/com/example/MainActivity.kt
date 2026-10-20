package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.example.ui.MainAppContainer
import com.example.ui.VaultixViewModel
import com.example.ui.theme.VaultixTheme

class MainActivity : ComponentActivity() {

    private val viewModel: VaultixViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            VaultixTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    MainAppContainer(viewModel = viewModel)
                }
            }
        }
    }
}
