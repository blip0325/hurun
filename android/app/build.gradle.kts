plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.hurun.app"
    compileSdk = 36

    signingConfigs {
        create("release") {
            storeFile = rootProject.file("hurunkeystore")
            storePassword = "123456"
            keyAlias = "key0"
            keyPassword = "123456"
        }
    }

    defaultConfig {
        applicationId = "com.hurun.app"
        minSdk = 24
        targetSdk = 36
        versionCode = (project.findProperty("versionCode") as? String)?.toInt() ?: 1
        versionName = project.findProperty("versionName") as? String ?: "1.0.0"
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-测试"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = "11"
    }

    buildFeatures {
        viewBinding = true
    }
}

// 构建前自动将 app/ 中的 Web 文件复制到 assets/www/
tasks.register<Copy>("copyWebAssets") {
    description = "Copy web files from ../../app/ to assets/www/"
    from(fileTree("../../app") {
        include("**/*")
        exclude("**/*.csv")
        exclude("**/*.ods")
        exclude("**/data.csv")
    })
    into("src/main/assets/www")
}

tasks.register<Copy>("copyDataFiles") {
    description = "Copy CSV data files from ../../app/ to assets/www/"
    from("../../app") {
        include("**/*.csv")
        exclude("**/data.csv")
    }
    into("src/main/assets/www")
}

tasks.register("prepareWebAssets") {
    dependsOn("copyWebAssets", "copyDataFiles")
}

tasks.matching { it.name.startsWith("preBuild") }.configureEach {
    dependsOn("prepareWebAssets")
}

dependencies {
    implementation(libs.core.ktx)
    implementation(libs.appcompat)
    implementation(libs.material)
    implementation(libs.constraintlayout)
    implementation(libs.webkit)
}
