#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 LMS Mobile App Diagnostics\n');

// Check if backend is running
function checkBackend() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8000/api/', (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        console.log('✅ Backend is running on http://localhost:8000');
        resolve(true);
      } else {
        console.log(`⚠️  Backend responded with status ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', () => {
      console.log('❌ Backend is NOT running on http://localhost:8000');
      console.log('   Start it with: cd backend && python manage.py runserver');
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      console.log('❌ Backend connection timeout');
      resolve(false);
    });
  });
}

// Check if Expo is running
function checkExpo() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:19006/', (res) => {
      console.log('✅ Expo dev server is running on http://localhost:19006');
      resolve(true);
    });
    
    req.on('error', () => {
      console.log('❌ Expo dev server is NOT running on http://localhost:19006');
      console.log('   Start it with: npm run start:web:clean');
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      console.log('❌ Expo connection timeout');
      resolve(false);
    });
  });
}

// Check critical files
function checkFiles() {
  const criticalFiles = [
    'App.js',
    'package.json',
    'app.json',
    'babel.config.js',
    'metro.config.js',
    'src/context/AuthContext.js',
    'src/navigation/AppNavigator.js',
    'src/api/client.js',
    'src/utils/constants.js',
  ];
  
  console.log('\n📁 Checking critical files:');
  let allExist = true;
  
  criticalFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    if (exists) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - MISSING!`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Check node_modules
function checkNodeModules() {
  const exists = fs.existsSync(path.join(__dirname, 'node_modules'));
  if (exists) {
    console.log('\n✅ node_modules exists');
    return true;
  } else {
    console.log('\n❌ node_modules is missing!');
    console.log('   Run: npm install');
    return false;
  }
}

// Check for conflicting processes
function checkPorts() {
  console.log('\n🔌 Port Status:');
  console.log('   Backend should be on: http://localhost:8000');
  console.log('   Frontend should be on: http://localhost:19006');
}

// Main diagnostic
async function diagnose() {
  console.log('Starting diagnostics...\n');
  
  const filesOk = checkFiles();
  const nodeModulesOk = checkNodeModules();
  
  console.log('\n🌐 Checking services:');
  const backendOk = await checkBackend();
  const expoOk = await checkExpo();
  
  checkPorts();
  
  console.log('\n📊 Summary:');
  console.log(`   Files: ${filesOk ? '✅' : '❌'}`);
  console.log(`   Dependencies: ${nodeModulesOk ? '✅' : '❌'}`);
  console.log(`   Backend: ${backendOk ? '✅' : '❌'}`);
  console.log(`   Frontend: ${expoOk ? '✅' : '❌'}`);
  
  if (filesOk && nodeModulesOk && backendOk && expoOk) {
    console.log('\n🎉 Everything looks good!');
    console.log('   Open http://localhost:19006 in your browser');
  } else {
    console.log('\n⚠️  Some issues detected. Follow the suggestions above.');
  }
  
  console.log('\n💡 Quick Commands:');
  console.log('   Clear cache: npm run clear');
  console.log('   Start clean: npm run start:web:clean');
  console.log('   Full reset: npm run reset');
}

diagnose();
