function log(m) {
    $(".output-wrapper")
        .append(`<li><pre>${m}</pre></li>`)
    $('#console').scrollTop(2 ** 32)
}

function evaluateConsoleExpression(exp) {
    e = exp.split(" ")
    if (currentCommand == "") {
        log("$ " + exp)
        switch (e[0]) {
            case "help":
                log('Это - консоль редактора RobotWDE. Вы читаете справку')
                log("Синтаксис справки:")
                log("   Фигурные скобки <b>{}</b> - обязательная часть выражения")
                log("   К примеру, <b>{команда}</b> означает, что на этом месте должна быть команда")
                log("   Квадратные скобки <i>[]</i> - необязательная часть выражения")
                log(
                    "   К примеру, <b>{команда}</b> <i>[аргумент]</i> означает, что на этом месте обязательно должна быть команда и может быть аргумент"
                )
                log("   Прямой слэш | - ИЛИ")
                log(
                    "   К примеру, {on|off} означает, что на этом месте должно быть только одно из выражений в скобках"
                )
                log("   Многоточие ... - и так далее")
                log(
                    "   К примеру, <i>[аргумент1 [аргумент2 ...]]</i> означает, что на это месте может быть 0 и больше аргументов"
                )
                log('<br>')
                log("Справка")
                log("   Консоль принимает команды в следующем формате:")
                log("   <b>{команда}</b> <i>[аргумент1 [аргумент2...]]</i>")
                log("Список команд:")
                log("   <b>help</b> - показать эту справку")
                log(
                    "   <b>run [имя файла]</b> - запустить программу под именем 'имя файла', если оно предоставлено, в противном случае запустить программу в открытой вкладке"
                )
                log(
                    "   <b>save [имя файла]</b> - сохранить 'имя файла', если оно предоставлено, в противном случае сохранить программу в открытой вкладке "
                )
                log(
                    "   <b>python3 [команда]</b> - интерпретировать 'команду' на языке Python3, если она предоставлена, в противном случае запустить python3 в интерактивном режиме"
                )
                log("   <b>night_mode {on|off}</b> - включить/выключить ночной режим</b>")
                log("<hr>")
                break
            case "run":
                run(e[1])
                break
            case "save":
                save(e[1])
                break
            case "python3":
                python(e[1])
        }
    } else {
        switch (currentCommand) {
            case "run":
                sendTo(id, exp.replace(/\\n/gi, "\n") + "\n")
                log(exp)
                break
            case "python3":
                sendToPython(exp.replace(/\\n/gi, "\n") + "\n")
                log(">>>" + exp)
        }
    }
}

$(".console-input input").keypress((ev) => {
    if (ev.keyCode == 13) {
        evaluateConsoleExpression($(".console-input input").val())
        $("#console input").val("")
    }
})