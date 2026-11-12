# 에러 코드 포털

공식 소프트웨어 문서에서 수집한 코드 4,836개의 검색·조회 포털입니다. 코드 하나당 정적 HTML 페이지 하나를 제공합니다.

- 공개 주소: https://nanalab.kr/error-code-directory/
- 한국어(root)·영어(en)·일본어(ja)·중국어(zh)·스페인어(es)·독일어(de)·프랑스어(fr)·포르투갈어(pt)·러시아어(ru) 9개 언어.
- Windows Win32, Installer 반환 코드·메시지, WinHTTP, WinINet, Microsoft Entra ID
- Node.js, PostgreSQL, SQLite, Python, Firebase Authentication Admin SDK, Google APIs/gRPC, Cloudflare HTTP, GitHub REST validation
- 코드·원문 설명·한국어 제품 문맥·공식 해결/진단/참고 링크
- 업체·제품 필터, 브라우저 내 검색, 코드·주소 복사, JavaScript 없이 탐색 가능한 페이지 목록
- 코드별 9개 정적 언어 URL, 동일 코드로 이동하는 푸터 언어 메뉴, self canonical·reciprocal hreflang. 원문 영어를 번역문과 함께 보존하며 자동 번역·도구 이름을 표시합니다.

## 번역 데이터

4,836개 코드 × 9개 언어 = 43,524개 세부페이지입니다. `data/i18n/`에 8개 비영어 언어의 설명을 저장하고 영어 페이지는 공식 원문을 사용합니다. 원본 카탈로그 SHA-256과 메시지 ID의 완전성을 빌드에서 확인합니다. 한국어 UI와 기존 제품 문맥도 유지합니다.

Google Translate로 생성한 설명과, OPUS-MT / Helsinki-NLP 모델을 CTranslate2 CPU INT8으로 실행한 설명을 구분합니다. 프랑스어는 두 도구의 결과가 섞여 있어 메시지별 제공자를 저장합니다. 번역은 사전에 생성되며 방문자 요청·검색어를 번역 서비스로 전송하지 않습니다. 기술 번역의 정확성을 보증하지 않으며 영문 원문과 공식 가이드가 판단 기준입니다.

모델 원저자·변환자·모델 버전과 라이선스 고지는 `data/translation-notices/` 및 공개 라이선스 페이지에 보존합니다. 모델 바이너리나 번역 실행 의존성은 공개 사이트에 포함하지 않습니다. 원문 설명의 출처별 재이용 조건도 그대로 적용됩니다.

앱 `sitemap.xml`은 언어별 `sitemap-ko.xml` 등 9개 leaf를 참조합니다. 각 leaf에는 5,086개 URL이 있으며 noindex 404는 제외합니다. NaNa 메인 인덱스에는 앱 인덱스를 중첩하지 않고 이 9개 leaf를 직접 등록합니다.

## 개발·빌드

빌드는 Node.js 22 이상, 전수 검사와 미리보기는 Python 3.9 이상을 사용합니다. 외부 npm/pip 패키지는 필요 없습니다. 검증된 데이터는 `data/`에 포함됩니다. Python이 PATH에 없다면 `PYTHON_EXECUTABLE`에 Python 실행 파일의 절대 경로를 지정하세요.

```sh
npm run build
npm run check
npm test
python tools/serve.py
```

미리보기: http://127.0.0.1:8788/error-code-directory/

GitHub Pages는 `main:/docs`를 배포합니다. 생성 파일 `docs/`를 함께 커밋합니다. 빌더는 소스·데이터로 결정적으로 생성하며 `--check`는 차이와 여분 파일을 검사합니다. `build-manifest.json`에 모든 공개 파일의 SHA-256을 남깁니다. 원본 수집 증거의 선택적 통합 스크립트 `tools/import_sources.py`는 워크스페이스 `.tools/error-code-portal-20261112/{microsoft,platforms,vendors}`에서 검증 완료된 수집물을 가져옵니다. 보통 빌드에는 이 외부 폴더가 필요하지 않습니다.

일반 빌드는 이전 완료 manifest와 해시가 같은 파일을 재사용해 대규모 언어 페이지의 디스크 I/O를 줄입니다. `--check`는 모든 실제 파일을 읽어 소스와 대조합니다. 생성 파일을 직접 수정·삭제한 경우 `node tools/build.mjs --force`로 복구한 뒤 `--check`를 실행합니다.

## 범위·출처

수집일 2026-11-12. 오류 4,699건, 경고·상태 137건. 14개 제품, 공식 출처 84건. 모든 소프트웨어 오류의 전체 목록이나 실시간 동기화 서비스는 아닙니다. 버전·발생 환경은 각 원문을 확인해야 합니다. 원문 설명은 영어로 유지합니다.

Windows Installer 메시지 번호와 반환 코드는 별도 네임스페이스입니다. Win32·Installer 반환 코드에는 공식 HRESULT_FROM_WIN32 규칙으로 검색 별칭을 추가합니다. 메시지 번호에는 적용하지 않습니다.

`solution_links.kind`는 `troubleshooting`, `diagnostic-guide`, `reference`입니다. 각각 코드별 해결 절차, 제품 공통 진단, 코드 정의를 구분합니다. 참고 문서만 있는 항목을 검증된 해결책으로 표시하지 않습니다. 다른 제품의 같은 번호는 별도 페이지입니다.

`data/sources.json`과 각 코드 페이지에 원문 URL·저작자·라이선스·변경 내역·확인일·원문 해시를 보존합니다. 라이선스 전문은 `data/notices/`와 공개 `licenses/notices/`에 보존합니다. 원문 HTML은 실행·배포하지 않습니다. 원문 문구의 권리는 각 출처에 있으며, 애플리케이션 소스의 MIT 라이선스와 별개입니다.

## 게시자 통합·개인정보

`src/publisher.mjs`에서 NaNa Lab의 검증된 GA4, GTM, AdSense, Cloudflare ID를 모든 HTML에 삽입합니다. GTM noscript와 중앙 도서 배너도 포함합니다. 검색어는 메모리 안에서 처리하고 URL·통계 이벤트·검색 요청으로 전송하지 않습니다. GA4 주소는 쿼리·해시를 제외합니다. 로컬 미리보기 서버는 게시자·배너 스크립트와 GTM iframe을 제거하고 CSP로 외부 요청을 차단합니다. 분석·광고·외부 문서 관련 고지는 공개 개인정보 페이지에 있습니다.

테스트는 검색·필터·복사·실패 처리, 로컬 게시자 차단, 전 HTML 태그·출처·라우트·사이트맵을 확인합니다. 실제 브라우저 화면과 외부 서비스의 수집·색인 완료는 별도 검증 대상입니다.
