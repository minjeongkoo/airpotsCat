# Discord App: 에어팟냥

![Made for REN](https://img.shields.io/badge/Made%20for-REN-blueviolet?style=plastic)

이 디스코드 봇은 **음성 채널에 일정 기간 동안 참여하지 않은 유저**를 "비활성 유저"로 간주하여, 지정된 관리자에게 **DM으로 자동 알림**을 전송합니다.

> 서버 운영자가 장기 미참여자를 파악하거나, 비활성 멤버를 관리하는 데 도움을 줍니다.<br>
> 아직은 다국어를 지원하지 않습니다. 한국어로 지원되는 봇입니다.

## Discord 설정
- "서버 정보를 확인할 수 없다고 나와요!"
  - 이 github 페이지의 링크를 통해 초대해주세요. 관리자 권한이 없어서 나타나는 문제일 가능성이 높습니다.
- "DM이 안와요"
  - 알림 필요 설정을 했는데도 DM이 오지 않는다면, Discord > 설정 > 콘텐츠 및 소셜 > 소셜 권한 > 해당 서버의 "다이렉트 메시지" 옵션을 "True"로 설정하셔야 DM을 받으실 수 있어요.
  - DM으로는 매일 오후 10시에 비활성 유저 목록을 받으실 수 있습니다. (있을 시에만 옵니다)
  - 미리 확인하고 싶으시면 '/확인' 명령어를 통해 수동으로도 확인 가능합니다.<br><br>

## 서버에 에어팟냥 데려가기
[에어팟냥 초대하기](https://discord.com/oauth2/authorize?client_id=1381815491164897321&permissions=8&integration_type=0&scope=bot+applications.commands)<br><br>

## 🛠️ 사용법: 기본 설정 흐름

1️⃣ **/reset-server**
- 서버 데이터를 초기화합니다.
- 모든 유저의 음성 채널 참여 시간을 현재 시각으로 초기화합니다.
- ⚠️ **봇을 처음 사용할 때 반드시 한 번 실행해야 합니다.**

2️⃣ **/status**
- 현재 서버의 비활성 기준, 알림 관리자, 제외 유저 목록을 확인합니다.
- 초기 상태에서는 대부분 “없음”으로 표시됩니다.

3️⃣ (필수) **/참여기준 [수치] [단위]**
- 비활성 유저로 간주할 기준을 설정합니다.
- 예: `/참여기준 10 일` → 10일 이상 미참여 시 비활성 처리

4️⃣ (선택) **/알림필요 @user**
- 비활성 유저 알림을 받을 관리자를 등록합니다.
- 알림은 매일 **오후 10시**, 디스코드 DM으로 전송됩니다.

5️⃣ (선택) **/제외 @user**
- 특정 유저를 비활성 유저 감지 대상에서 제외합니다.
- 봇 계정, 테스트 계정 등은 제외 권장<br><br>

---
## 전체 기능 안내

- `/status` : 비활성 기준, 알림 받고 있는 사람, 제외 대상 현황 확인
- `/참여기준` : 비활성 기준 일수 또는 시간 설정
- `/알림필요` : 알림 받을 관리자 등록
- `/알림이용중` : 등록된 관리자 목록 보기
- `/제외` : 특정 유저를 비활성 감지 대상에서 제외
- `/제외목록` : 제외된 유저 목록 보기
- `/제외삭제` : 특정 유저를 다시 감지 대상으로 복원
- `/알림제거` : 알림 관리자에서 제거
- `/확인` : 수동으로 비활성 유저 검사 및 DM 발송
- `/voice_chat_logs` : 모든 유저의 마지막 음성 채널 참여 시간 확인
- `/help` : 명령어 사용법 비공개 안내
- `/reset-server` : 서버 데이터를 초기화하고 모든 유저 참여 시간을 현재로 설정<br><br>


## Bot 권한
- Admin
<br><br>
---
<br><br>
# for Developer

## 서버 설치 및 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. .env 파일 생성

```env
BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
```
- CLIENT_ID는 Discord Developer Portal의 Application ID입니다.

### 3. 슬래시 명령어 등록
```bash
node deploy-commands.js
```

### 4. 봇 실행
이 봇은 다음과 같이 **2개의 프로세스를 동시에 실행해야 합니다**

```bash
node index.js
```
- 슬래시 커맨드 처리
- 유저 음성채널 이벤트 추적
- 데이터베이스 초기화 및 상태 확인 등

```bash
node scheduler.js
```
- 매일 오후 10시에 비활성 유저를 감지하고
- 등록된 관리자에게 **DM으로 알림 전송**

✅ **두 파일 모두 실행 중이어야 시스템이 정상 작동합니다.**  
`pm2` 같은 프로세스 매니저를 사용하는 것도 권장됩니다.

## 프로젝트 구조
```bash
airpotsCat/
├── index.js                 # 메인 파일 (봇 실행 및 이벤트 등록)
├── commands.js              # 슬래시 명령어 핸들러 및 명령 로직
├── scheduler.js             # 매일 일정 시간에 실행되는 스케줄러 봇
├── scheduler-core.js        # 실제 비활성 유저 검사 및 알림 로직
├── db.js                    # SQLite DB 함수들 (get/set/insert 등)
├── init-db.js               # DB 초기화용 스크립트 (필요시 수동 실행)
├── database.sqlite          # SQLite 실제 DB 파일
├── .env                     # 환경변수 (봇 토큰 등)
├── package.json             # 프로젝트 설정 및 의존성 목록
└── README.md                # 기능 설명 및 설치 안내
```

## 봇 최소 권한
- View Channels
- Send Messages
- Connect (음성 채널 접속 확인용)
- Use Slash Commands
*저는 귀찮아서 Admin으로 했습니다. 최소 권한 테스트는 안해봐서 잘 모르겠슈.

## 주의 사항
- 이 봇은 서버 내 관리자만 사용 가능하도록 설계되어 있습니다.
- Server Members Intent를 Discord Developer Portal > Bot 탭에서 반드시 활성화해야 합니다.

## 문의 및 개선 & 라이센스
- Discord DM: rekenzo#3030
- Discord Server: https://discord.gg/uAGEF3wy
- 라이센스: MIT (필요 시 명시)

---
