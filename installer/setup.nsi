!define PRODUCT_NAME "Finora"
!define PRODUCT_VERSION "4.2.8"
!define PRODUCT_PUBLISHER "Finora"
!define PRODUCT_WEB_SITE "https://finora.app"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\Finora.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

SetCompressor lzma

!include "MUI2.nsh"
!include "FileFunc.nsh"

; MUI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "..\public\icon.ico"
!define MUI_UNICON "..\public\icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "..\assets\installer-header.bmp"
!define MUI_HEADERIMAGE_UNBITMAP "..\assets\installer-header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "..\assets\installer-welcome.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "..\assets\installer-welcome.bmp"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Languages
!insertmacro MUI_LANGUAGE "English"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "..\release\Finora-Setup-${PRODUCT_VERSION}.exe"
InstallDir "$PROGRAMFILES64\${PRODUCT_NAME}"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show
RequestExecutionLevel admin

Section "MainApplication" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite ifnewer
  
  ; Main application files
  File /r "..\dist\*.*"
  File "..\electron\main.js"
  File "..\electron\preload.js"
  File "..\package.json"
  
  ; Resources
  File /r "..\assets\*.*"
  
  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_NAME}.exe"
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_NAME}.exe"
  
  ; Write registry keys
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\${PRODUCT_NAME}.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\${PRODUCT_NAME}.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  
  ; Write uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  ; Remove shortcuts
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"
  
  ; Remove application files
  RMDir /r "$INSTDIR\*.*"
  RMDir "$INSTDIR"
  
  ; Remove registry keys
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  
  ; Ask about user data
  MessageBox MB_YESNO "Remove user data and settings?" IDNO +2
  RMDir /r "$APPDATA\${PRODUCT_NAME}"
SectionEnd
