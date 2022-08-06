var ip = "test.mosquitto.org";
var port = "8081";
var usessl = false;
var id = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
var username = '';
var password = '';
var message, client;
var connected = false;
var widgetRepository = {}; //property names are datastreams(keys), values are widget objects

function CreateWidget(config) {
    var datastream = config.datastream;
    if(Array.isArray(datastream)) {
        datastream.forEach(function (element) {
            widgetRepository.hasOwnProperty(element) ? console.log("Duplicate Datastream: " + element) : (widgetRepository[element] = config);
            //widgetRepository[element] = config;
        })
    } else if (typeof datastream === 'string' || datastream instanceof String){
        widgetRepository.hasOwnProperty(datastream) ? console.log("Duplicate Datastream: " + datastream) : (widgetRepository[config.datastream] = config);
        //widgetRepository[config.datastream] = config;
    }
}

function RenderWidgets() {
    connectMQTT();
}

function printwidgetRepository() {
    for (var widgetKey in widgetRepository) {
        console.log("widgetKey: " + widgetKey);
        if (widgetRepository.hasOwnProperty(widgetKey)) {
            for (var widgetprop in widgetRepository[widgetKey]) {
                if (widgetRepository[widgetKey].hasOwnProperty(widgetprop)) {
                   console.log(widgetprop + ': ' + widgetRepository[widgetKey][widgetprop]);
                }
            }
        }
    }
}

function connectMQTT() {
    client = new Paho.MQTT.Client(ip, Number(port), id);
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    client.connect({
        useSSL: usessl,
        onSuccess: onConnect,
        onFailure: onFailure,
        reconnect: true
    });
}

function onConnect() {
    console.log("Connected to server");
    resetUsernamePassword();
    $("#mainPage").show();
    var widget = {};
    for (var widgetKey in widgetRepository) {
        widget = widgetRepository[widgetKey];
        if (widget.type == '')
            widget.type = "gauge";

        switch (widget.type) {
            case "gauge":
                widget.widgetVar = Gauge(widget);
                break;
            case "piechart":
                widget.widgetVar = PieChart(widget);
                break;
            case "timeseries":
                widget.widgetVar = TimeSeries(widget);
                break;
            case "card":
                widget.widgetVar = widget.type + "_" + widget.bindto;
                $("#" + widget.bindto).html('<div class="card"><div class="cardValue" style="background-color:' + widget.color+ '"><h1 id="' + widget.widgetVar + '">0</h1><span class="cardLabel">' + widget.label + '</span></div></div>');
                break;
            case "spline":
                widget.widgetVar = SplineChart(widget);
                break;
            case "barchart":
                widget.widgetVar = BarChart(widget);
                break;
            case "currencycard":
                widget.widgetVar = widget.type + "_" + widget.bindto;
                $("#" + widget.bindto).html('<div class="card"><div id="div_' + widget.widgetVar + '" class="cardValue"><h1 id="' + widget.widgetVar + '" font-family="Arial"></h1><span class="cardLabel">' + widget.label + '</span></div></div>');
                break;
            case "alerttext":
                widget.widgetVar = widget.type + "_" + widget.bindto;
                break;
            case "labeltext":
                widget.widgetVar = widget.type + "_" + widget.bindto;
                break;
            case "simpletable":
                widget.widgetVar = widget.type + "_" + widget.bindto;
                break;
            default:
                console.log("The " + widget.type + " widget type for the " + widgetKey + " datastream did not match with any of the standard types in onConnect function");
                break;
        }

    }

    //each key is a datastream which is subscribed
    Object.keys(widgetRepository).forEach(function(datastream,index) {
        client.subscribe(datastream, {
            qos: 0
        });
    });
}

function onMessageArrived(message) {
    try {
        console.log("Recieved Message from server");
        var value = message.payloadString;
        var datastream = message.destinationName;
        console.log("datastream: " + datastream + ", value: " + value);

        var widget = widgetRepository[datastream];
        switch (widget.type) {
            case "gauge":
                updateGauge(widget.widgetVar, widget.label, JSON.parse(value));
                break;
            case "piechart":
                updatePieChart(widget.widgetVar, eval(value));
                widget.value = eval(value);
                break;
            case "card":
                updateCard(widget.widgetVar, JSON.parse(value));
                break;
            case "timeseries":
                updateTimeSeries(widget.widgetVar, eval(value));
                break;
            case "spline":
                updateSplineChart(widget.widgetVar, eval(value));
                break;
            case "barchart":
                updateBarChart(widget, eval(value));
                break;
            case "currencycard":
                updateCurrencyCard(widget, JSON.parse(value));
                break;
            case "alerttext":
                updateAlertText(widget, value);
                break;
            case "labeltext":
                updateLabelText(widget, value);
                break;
            case "simpletable":
                updateSimpleTable(widget, eval(value), datastream);
                break;
            default:
                console.log("The widget type, " + widget.type + ", for the datastream, " + datastream + ", did not match with the any of the standard widget typed in OnMessageArrived function");
                break;
        }
    } catch (e) {
        console.log("exception in onMessageArrived: " + e);
        return false;
    }
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:" + responseObject.errorMessage);
    }
}

function Gauge(widget) {
    var widgetVar = c3.generate({
        bindto: '#' + widget.bindto,
        data: {
            columns: [
                [widget.label, 0]
            ],
            onclick: function () {
                if(widget.url != null) {
                    window.open(widget.url);
                }
            },
            type: 'gauge'

        },
        gauge: {
            label: {
                format: function (value, ratio) {
                    return value + '%';
                },
                show: false // to turn off the min/max labels.
            },
        },
        color: {
            pattern: widget.color_pattern, // the three color levels for the percentage values.
            threshold: {
                values: widget.color_threshold_values
            }
        },
        size: {
            height: widget.height
        },
        tooltip: {
            show: false
        },

    });

    //Set Label
    // $("#" + widget.bindto).append("<div style='display:block'>" + widget.label + "</div>");

    return widgetVar;
}

function PieChart(widget) {
    var c3Props = {
        bindto: '#' + widget.bindto,
        data: {
            columns: [],
            type: 'pie',
            empty: {
                label: {
                    text: 'No Data Available',
                }
            }            
        },
        color: {
            pattern: widget.color,
        },
        size: {
            height: widget.height
        }
    }

    var widgetVar = customizeWidget(widget, c3Props);
    //Set Label
    // $("#" + widget.bindto).append("<div style='display:block'>" + widget.label + "</div>");

    return widgetVar;
}

/*
function PieChart(widget) {
    var widgetVar = c3.generate({
        bindto: '#' + widget.bindto,
        data: {
            columns: [],
            onclick: function (d,i) {
                if(widget.urls != null) {
                    for (var key in widget.urls) {
                        if(d.id == widget.urls[key]['title']) {
                            window.open(widget.urls[key]['url']);
                            }
                    }
                    }
                },
            type: 'pie',
            empty: {
                label: {
                    text: 'No Data Available',
                }
            }
        },
        color: {
            pattern: widget.color,
        },
        pie: {
            label: {
                format: function(value, ratio, id) {
                return value;
                }
            }
        },
        size: {
            height: widget.height
        }
    });

    //Set Label
    $("#" + widget.bindto).append("<div style='display:block'>" + widget.label + "</div>");

    return widgetVar;
}
*/

function BarChart(widget) {
    var c3Props = {
        bindto: '#' + widget.bindto,
        data: {
            columns: [],
            type: 'bar',
            labels: true,
            empty: {
                label: {
                    text: 'No Data Available',
                }
            }            
        },
        bar: {
            width: {
                ratio: 0.5 // this makes bar width 50% of length between ticks
            },
            space: 0.6
            // or
            //width: 100 // this makes bar width 100px
        },
        size: {
            height: widget.height
        }
    };

    var widgetVar = customizeWidget(widget, c3Props);

    //Set Label
    $("#" + widget.bindto).append("<div style='display:block'>" + widget.label + "</div>");

    return widgetVar;
}

function SplineChart(widget) {
    var widgetVar = c3.generate({
        bindto: '#' + widget.bindto,
        data: {
            columns: [],
            onclick: function () {
                if(widget.url != null){
                    window.open(widget.url);
                }
            },
            type: 'spline'
        },
        size: {
            height: widget.height
        },
        grid: {
            y: {
                lines: [{value: 85, text: '85%', class: 'threshold'}]
            }
        },
        axis: {
            y: {
                min: 0,
                max: 100,
                padding: {
                    top: 0,
                    bottom: 0
                },
                label: {
                    text: '%',
                    position: 'outer-middle'
                }
            }
        }
    });

    //Set Label
    $("#" + widget.bindto).append("<div style='display:block'>" + widget.label + "</div>");

    return widgetVar;
}

function TimeSeries(widget) {
    var widgetVar = c3.generate({
        bindto: '#' + widget.bindto,
        data: {
            x: 'x',
            xFormat: '%Y-%m-%d %H:%M:%S',
            columns: [],
            onclick: function () {
                if(widget.url != null){
                    window.open(widget.url);
                }
            },
        },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    rotate: -20,
                    format: '%H:%M'
                },
                padding: {
                    left: 0,
                    right: 0
                  }
            },
            y: {
                max: 100,
                min: 0,
                padding: {top: 0, bottom: 0},
                label: {
                    text: '%',
                    position: 'outer-middle'
                }
            }
        },
        grid: {
            y: {
                lines: [{value: 85, text: '85%', class: 'threshold'}]
            }
        },
        size: {
            height: widget.height
        }
    });

    //Set Label
    $("#" + widget.bindto).append("<div style='display:block'>" + widget.label + "</div>");

    return widgetVar;
}

function updateGauge(widgetVar, label, value) {
    setTimeout(function () {
        widgetVar.load({
            columns: [
                [label, value]
            ]
        });
    }, 1000);
}

function updatePieChart(widgetVar, value) {
    setTimeout(function () {
        widgetVar.load({
            columns: value
        });
        widgetVar.legend.show();
    }, 1000);
}

function updateBarChart(widget, value) {
    if(widget.hasOwnProperty('color') && widget.color.length >= value.length) {
        var colorObj = {};
        value.forEach(function (element, index) {
            colorObj[element[0]] = widget.color[index];
        })

        setTimeout(function () {
            widget.widgetVar.load({
                columns: value,
                colors: colorObj
            });
        }, 1000);
    } else {
        setTimeout(function () {
            widget.widgetVar.load({
                columns: value
            });
        }, 1000);
    }
}

function updateSplineChart(widgetVar, value) {
    setTimeout(function () {
        widgetVar.load({
            columns: value
        });
    }, 1000);
}

function updateCard(widgetVar, value) {
    setTimeout(function () {
        value.toLocaleString('en');

        $("#" + widgetVar).each(function () {
            $(this).prop('Counter', $(this).text()).animate({
                Counter: value
            }, {
                duration: 1000,
                easing: 'swing',
                step: function (now) {
                    $(this).text(Math.ceil(now));
                }
            });
        });

    }, 1000);
}

function updateTimeSeries(widgetVar, value) {
    setTimeout(function () {
        widgetVar.load({
            columns: value

        });
    }, 1000);
}

function updateCurrencyCard(widget, value) {
    setTimeout(function () {
        value.toLocaleString('en');
        // $("#" + widget.widgetVar).text(formatter.format(value));
        $("#" + widget.widgetVar).text(currencyFormatter(widget, value));
        var cardValueDiv = "#div_" + widget.widgetVar;
		if(widget.threshold === undefined || value < widget.threshold) {
			$(cardValueDiv + '.cardValue').css({'background-color': '#2c97c9'});
			$(cardValueDiv).fadeTo("slow", 0.4).fadeTo("slow", 1);
		}
		else  {
            if(widget.threshold_background_color !== undefined && value >= widget.threshold) {
                $(cardValueDiv + '.cardValue').css({'background-color': widget.threshold_background_color});
            }
			$(cardValueDiv).fadeTo("slow", 0.4).fadeTo("slow", 1);
        }
    }, 1000);
}

function updateLabelText(widget, value) {
    $('#' + widget.bindto).html(value);
    /*
    if (value !== null && value !== '') {
        for(var i =0; i < 5; i++) {
            $('#' + widget.bindto).fadeTo("slow", 0.4).fadeTo("slow", 1);
        }
    }
    */
}

function updateAlertText(widget, value) {
    $('#' + widget.bindto + " .alertDivText").html(value);
    if (value !== null && value !== '') {
        for(var i =0; i < 5; i++) {
            $('#' + widget.bindto + " .alertDivText").fadeTo("slow", 0.4).fadeTo("slow", 1);
        }
        $('#' + widget.bindto + " li").show();
    } else {
        $('#' + widget.bindto + " li").hide();
    }
}

function hideAlertText(elmnt) {
    $(elmnt).parent().css("display", "none");
}

function updateSimpleTable(widget, valueArray, datastream) {
    var idExists = false;
    var rowId = 0;

    $("#" + widget.bindto + " table tbody tr").each(function(index) {
        var id = $(this).find("td:first").html();
        if(id === datastream)  {
            idExists = true;
            rowId = index;
            return false;
        }
    });
    if(idExists) {
        var trElmnt = $("#" + widget.bindto + " table tbody tr").eq(rowId);
        var valueIndex = 0;
        for (valueIndex = 0; valueIndex < valueArray.length; valueIndex++) {
            trElmnt.find("td").eq(valueIndex+1).html(valueArray[valueIndex]);
        }
    }
    else {
        addSimpleTableRow(widget, valueArray, datastream);
    }
    if(widget.sort) {
        sortTable($('#myTable'),'desc',5,6);
    }
}

function sortTable(table, order, col1, col2) {
    var  table, rows, switching, i, x, y, shouldSwitch, col2intialValue, col2nextValue;
    table = document.getElementById("myTable");
    switching = true;
    while (switching) {
      switching = false;
      rows = table.getElementsByTagName("TR");
      for (i = 1; i < (rows.length - 1); i++) {
        shouldSwitch = false;
        x = rows[i].getElementsByTagName("TD")[col1];
        y = rows[i + 1].getElementsByTagName("TD")[col1];

        col2intialValue = rows[i].getElementsByTagName("TD")[col2];
        col2nextValue = rows[i + 1].getElementsByTagName("TD")[col2];

        if(order === 'desc')
        {
          if (parseFloat(x.innerHTML) == parseFloat(y.innerHTML)) {
            if (parseFloat(col2intialValue.innerHTML) < parseFloat(col2nextValue.innerHTML)) {
              shouldSwitch = true;
              break;
            }
          } else if (parseFloat(x.innerHTML) < parseFloat(y.innerHTML)) {
            shouldSwitch = true;
            break;
          }
        }else{
          if (parseFloat(x.innerHTML) == parseFloat(y.innerHTML)) {
            if (parseFloat(col2intialValue.innerHTML) < parseFloat(col2nextValue.innerHTML)) {
              shouldSwitch = true;
              break;
            }
          } else if (parseFloat(x.innerHTML) > parseFloat(y.innerHTML)) {
            shouldSwitch = true;
            break;
          }
        }
      }
      if (shouldSwitch) {
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
      }
    }
}

function addSimpleTableRow(widget, valueArray, datastream) {
    var tableRowBeginString = "<tr>";
    var commentedTableDataIdString =   "<td style='display:none;'>" + datastream + "</td>"
    var tableDataString = "";
    var tableRowEndString = "</tr>";
    var valueIndex = 0;
    for (valueIndex = 0; valueIndex < valueArray.length; valueIndex++) {
        tableDataString += "<td>" + valueArray[valueIndex] + "</td>";
    }
    //$("#" + widget.bindto + " table tr:last").after(tableRowBeginString + tableDataString + tableRowEndString);
    $("#" + widget.bindto + " table tbody").append(tableRowBeginString + commentedTableDataIdString + tableDataString + tableRowEndString);
}

/*
function updateAlertText(widget, value) {
    $('#' + widget.bindto).html(value);
    if (value !== null && value !== '') {
        for(var i =0; i < 5; i++) {
            $('#' + widget.bindto).fadeTo("slow", 0.4).fadeTo("slow", 1);
        }
        $("#alertDiv li").show();
    } else {
        $("#alertDiv li").hide();
    }
}


function hideAlertText() {
    document.getElementById("alertText").parentNode.style.display='none';
}
*/

// Create our currency formatter.
/*
var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    // the default value for minimumFractionDigits depends on the currency
    // and is usually already 2
  });
  */

function currencyFormatter(widget, value) {
    if(widget.locale !=undefined && widget.style !=undefined && widget.currency !=undefined && widget.minimumFractionDigits !=undefined) {
        var intlCurrencyFormat = new Intl.NumberFormat(widget.locale, {
            style: widget.style,
            currency: widget.currency,
            minimumFractionDigits: widget.minimumFractionDigits
            });
        return intlCurrencyFormat.format(value);
    }
    else {
        return new Intl.NumberFormat().format(value);
    }
}

function updateAllWidgets() {
    widgetList.forEach(function (widget) {
        switch (widget.type) {
            case "piechart":
            updatePieChart(widget.widgetVar, widget.value);
            break;
        }
    });
}

function hasCustomWidgetProperty(widget) {
    return widget.hasOwnProperty("customWidget");
}

function getCustomProps(widget){
    //find function object assuming the function is declared as Window object (& not in a namespace)        
    var fn = window[widget.customWidget];
    if(typeof fn != 'undefined' && typeof fn === 'function') {
        return fn(widget);
    }
    else {
        console.log("customWidget JS function mentioned for the datastream '" + widget.datastream + "' in CreateMethod is not declared");
        return null;
    }
}

function customizeWidget(widget, c3Props) {
    if(hasCustomWidgetProperty(widget, c3Props)) {
        var c3CustomProps = getCustomProps(widget);
        $.extend(true, c3Props, c3CustomProps);
    }
    return c3.generate(c3Props);
}

//Code added for login popup
function setUserCredentails(username, password){
    this.username = username;
    this.password = password;
}

function resetUsernamePassword() {
	$("#username").val('');
	$("#password").val('');
	username = '';
	password = '';
}

function onFailure(responseObject) {
    if (responseObject.errorCode === 8) {
        console.log("onFailure errorCode/errorMessage: " + responseObject.errorCode + "/" + responseObject.errorMessage);
        $("#validateHeader").text("Invalid Username/Password. Please enter again.");

    } else if (responseObject.errorCode === 7) {
        console.log("onFailure errorCode/errorMessage: " + responseObject.errorCode + "/" + responseObject.errorMessage);
        $("#validateHeader").html("New SSL Certificate added. Import SSL Certificate.");

    } else if (responseObject.errorCode !== 0 && responseObject.errorCode !== 8 && responseObject.errorCode !== 7) {
        console.log("onFailure errorCode/errorMessage: " + responseObject.errorCode + "/" + responseObject.errorMessage);
        $("#validateHeader").text("Contact Administrator.");

    }
    resetUsernamePassword();
    $("#dialog-form").dialog("open");
}

/*
function onFailure(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onFailure errorCode/errorMessage: " + responseObject.errorCode + "/" + responseObject.errorMessage);
        resetUsernamePassword();
        $("#validateHeader").text("Invalid Username/Password. Please enter again.");
        $("#dialog-form").dialog("open");

    }
}
*/

//submit login form on pressing enter key in password field
$('#password').keypress(function (e) {
    if (e.which == 13) {
      $('#credentailsSubmit').click();
      return false;
    }
});

$(function() {

    $("#dialog-form").dialog({
        autoOpen: true,
        closeOnEscape: false,
        open: function(event, ui) {
            $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
        },
        position: { my: "center", at: "top", of: window }
    });
    $("#credentailsSubmit").on("click", function() {
        //$("#dialog").dialog("open");
        var dialog, form,
        username = $("#username").val(),
        password = $("#password").val();

        $("#dialog-form").dialog("close");
        setUserCredentails(username,password);
        RenderWidgets();
    });
});
