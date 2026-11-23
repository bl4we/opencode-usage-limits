# OpenCode Usage Limits

Небольшой локальный GUI-плагин для **OpenCode Desktop**. Показывает в нижней части левой панели (вертикальные вкладки):

- лимиты OpenCode Go: 5 часов, неделя, месяц;
- баланс **Extra usage / Available credit**;
- по клику открывает штатное окно с подробными лимитами.

Пример:

`Go 38% · 15% · 79% · $15.15`

Плагин ничего не хранит и не отправляет наружу. Он берёт текущую авторизацию OpenCode Console через локальный сервер OpenCode и запрашивает только `billing/status`, чтобы показать баланс.

## Установка

### Windows

Самый простой вариант — перенести на другое устройство только `install-usage-limits.ps1` и запустить:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-usage-limits.ps1
```

Либо распакуй весь архив и запусти `install.cmd`.

После установки перезапусти OpenCode (или выполни `opencode reload` и нажми `Ctrl+R`) и открой любую сессию.

### macOS / Linux

Перенеси только `install-usage-limits.sh` и выполни:

```sh
sh install-usage-limits.sh
```

Либо из распакованного архива:

```sh
bash install.sh
```

Затем перезапусти OpenCode или выполни `opencode reload`.

## Требования

- OpenCode Desktop 2.3.x или новее.
- Включён режим вертикальных вкладок (левая панель).
- Аккаунт OpenCode Console подключён на этом устройстве. Для баланса Extra usage нужна активная авторизация Console.

## Удаление

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\uninstall.ps1
```

macOS / Linux:

```sh
bash uninstall.sh
```

Либо просто удали папку:

- Windows: `%USERPROFILE%\.config\opencode\plugins\usage-limits`
- macOS / Linux: `~/.config/opencode/plugins/usage-limits`

## Установка одной командой

Плагин уже лежит в публичном репозитории:

```sh
opencode plugin add github:bl4we/opencode-usage-limits
```

После установки перезапусти OpenCode (или выполни `opencode reload`) и войди в OpenCode Console на этом устройстве.

Если пакет когда-нибудь опубликуют в npm, будет работать и так:

```sh
opencode plugin add opencode-usage-limits
```
