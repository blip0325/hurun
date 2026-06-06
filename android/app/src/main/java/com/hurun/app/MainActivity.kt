package com.hurun.app

import android.annotation.SuppressLint
import android.content.ContentValues
import android.content.res.Configuration
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.core.view.updateLayoutParams
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.hurun.app.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var currentPage: Page = Page.TOP500
    private var top500WebView: WebView? = null
    private var richWebView: WebView? = null

    private enum class Page(val path: String, val navId: Int) {
        TOP500("www/top500/500data.html", R.id.nav_top500),
        RICH("www/rich/rich.html", R.id.nav_rich)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupStatusBar()
        setupBottomNav()
        initWebViews()
        loadPage(Page.TOP500)
    }

    // ============================================================
    //  状态栏：沉浸式 + 浅色图标（跟随主题）
    // ============================================================
    private fun setupStatusBar() {
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val controller = WindowInsetsControllerCompat(window, window.decorView)

        // 浅色背景用深色图标，暗色背景用浅色图标
        val isDark = isNightMode()
        controller.isAppearanceLightStatusBars = !isDark
        controller.isAppearanceLightNavigationBars = !isDark

        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = if (isDark) Color.parseColor("#1A1A2E") else Color.WHITE

        // 给 WebView 容器加 statusBar 高度的 padding
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { view, insets ->
            val statusBars = insets.getInsets(WindowInsetsCompat.Type.statusBars())
            val navBars = insets.getInsets(WindowInsetsCompat.Type.navigationBars())

            binding.webViewContainer.updateLayoutParams<androidx.constraintlayout.widget.ConstraintLayout.LayoutParams> {
                topMargin = statusBars.top
            }

            binding.bottomNav.updateLayoutParams<androidx.constraintlayout.widget.ConstraintLayout.LayoutParams> {
                bottomMargin = navBars.bottom
            }

            WindowInsetsCompat.CONSUMED
        }
    }

    private fun isNightMode(): Boolean {
        return resources.configuration.uiMode and
                Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES
    }

    // ============================================================
    //  底部导航
    // ============================================================
    private fun setupBottomNav() {
        binding.bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_top500 -> {
                    loadPage(Page.TOP500)
                    true
                }
                R.id.nav_rich -> {
                    loadPage(Page.RICH)
                    true
                }
                else -> false
            }
        }
    }

    // ============================================================
    //  WebView 管理
    // ============================================================
    @SuppressLint("SetJavaScriptEnabled")
    private fun initWebViews() {
        top500WebView = createWebView(Page.TOP500)
        richWebView = createWebView(Page.RICH)
    }

    private fun createWebView(page: Page): WebView {
        val wv = WebView(this).apply {
            layoutParams = android.widget.FrameLayout.LayoutParams(
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                android.widget.FrameLayout.LayoutParams.MATCH_PARENT
            )
            visibility = View.GONE

            // --- 基础设置 ---
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = true             // 读取 assets 文件
                allowContentAccess = true
                databaseEnabled = true
                setSupportZoom(false)
                builtInZoomControls = false
                useWideViewPort = true
                loadWithOverviewMode = true
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                // 允许访问 file:// URL 的同级资源
                allowFileAccessFromFileURLs = true
                allowUniversalAccessFromFileURLs = true
            }

            // --- 暗色模式 ---
            applyDarkMode()

            // --- JS 接口 ---
            addJavascriptInterface(WebAppInterface(), "Android")

            // --- WebViewClient ---
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    // 注入暗色模式检测脚本
                    injectThemeScript(view)
                }

                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    // 所有导航在 WebView 内处理
                    request?.url?.let { uri ->
                        if (uri.scheme == "file" || uri.host == "appassets.androidplatform.net") {
                            return false // 允许加载本地资源
                        }
                    }
                    return false
                }
            }

            // --- WebChromeClient ---
            webChromeClient = object : WebChromeClient() {
                override fun onReceivedTitle(view: WebView?, title: String?) {
                    super.onReceivedTitle(view, title)
                    if (view == getCurrentWebView()) {
                        supportActionBar?.title = title
                    }
                }
            }
        }

        return wv
    }

    private fun applyDarkMode() {
        val isDark = isNightMode()
        listOfNotNull(top500WebView, richWebView).forEach { wv ->
            if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
                WebSettingsCompat.setForceDark(
                    wv.settings,
                    if (isDark) WebSettingsCompat.FORCE_DARK_ON
                    else WebSettingsCompat.FORCE_DARK_OFF
                )
            }
            if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
                @Suppress("DEPRECATION")
                WebSettingsCompat.setAlgorithmicDarkeningAllowed(wv.settings, isDark)
            }
        }
    }

    private fun injectThemeScript(view: WebView?) {
        val js = """
            (function() {
                var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            })();
        """.trimIndent()
        view?.evaluateJavascript(js, null)
    }

    // ============================================================
    //  页面加载
    // ============================================================
    private fun loadPage(page: Page) {
        if (currentPage == page && getCurrentWebView()?.url != null) return
        currentPage = page

        val container = binding.webViewContainer
        val targetWv = when (page) {
            Page.TOP500 -> top500WebView
            Page.RICH -> richWebView
        }

        // 隐藏另一个 WebView
        val otherWv = when (page) {
            Page.TOP500 -> richWebView
            Page.RICH -> top500WebView
        }
        otherWv?.visibility = View.GONE

        // 显示目标 WebView
        if (targetWv?.parent == null) {
            container.removeAllViews()
            container.addView(targetWv)
        }
        targetWv?.visibility = View.VISIBLE

        // 首次加载
        val url = "file:///android_asset/${page.path}"
        if (targetWv?.url != url) {
            targetWv?.loadUrl(url)
        }
    }

    private fun getCurrentWebView(): WebView? = when (currentPage) {
        Page.TOP500 -> top500WebView
        Page.RICH -> richWebView
    }

    // ============================================================
    //  返回键处理
    // ============================================================
    override fun onBackPressed() {
        val wv = getCurrentWebView()
        if (wv?.canGoBack() == true) {
            wv.goBack()
        } else {
            super.onBackPressed()
        }
    }

    // ============================================================
    //  暗色模式切换
    // ============================================================
    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        applyDarkMode()
        setupStatusBar()
    }

    override fun onDestroy() {
        listOfNotNull(top500WebView, richWebView).forEach { wv ->
            wv.removeJavascriptInterface("Android")
            wv.destroy()
        }
        super.onDestroy()
    }

    // ============================================================
    //  JavaScript 桥接接口
    // ============================================================
    inner class WebAppInterface {
        /** 页面通过 JS 调用，告知 Android 返回上一页 */
        @android.webkit.JavascriptInterface
        fun goBack() {
            runOnUiThread {
                onBackPressedDispatcher.onBackPressed()
            }
        }

        /** 用默认浏览器打开外部链接 */
        @android.webkit.JavascriptInterface
        fun openExternalUrl(url: String) {
            runOnUiThread {
                try {
                    val intent = android.content.Intent(android.content.Intent.ACTION_VIEW,
                        android.net.Uri.parse(url))
                    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                    startActivity(intent)
                } catch (e: Exception) {
                    showToast("无法打开链接：${e.message}")
                }
            }
        }

        /** 获取当前是否为暗色模式 */
        @android.webkit.JavascriptInterface
        fun isDarkMode(): Boolean = isNightMode()

        /** Toast / Snackbar 提示 */
        @android.webkit.JavascriptInterface
        fun showToast(message: String) {
            runOnUiThread {
                com.google.android.material.snackbar.Snackbar
                    .make(binding.root, message, com.google.android.material.snackbar.Snackbar.LENGTH_SHORT)
                    .show()
            }
        }

        /** 导出 CSV 到下载目录 */
        @android.webkit.JavascriptInterface
        fun saveCsvToDownloads(csvData: String, filename: String) {
            runOnUiThread {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        val values = ContentValues().apply {
                            put(MediaStore.Downloads.DISPLAY_NAME, filename)
                            put(MediaStore.Downloads.MIME_TYPE, "text/csv")
                            put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                        }
                        val uri = contentResolver.insert(
                            MediaStore.Downloads.EXTERNAL_CONTENT_URI, values
                        )
                        uri?.let {
                            contentResolver.openOutputStream(it)?.use { os ->
                                os.write(csvData.toByteArray(Charsets.UTF_8))
                            }
                        }
                    } else {
                        @Suppress("DEPRECATION")
                        val dir = Environment.getExternalStoragePublicDirectory(
                            Environment.DIRECTORY_DOWNLOADS
                        )
                        val file = java.io.File(dir, filename)
                        file.writeText(csvData, Charsets.UTF_8)
                    }
                    showToast("已导出到下载目录：$filename")
                } catch (e: Exception) {
                    showToast("导出失败：${e.message}")
                }
            }
        }
    }
}
