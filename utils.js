export const d = document, w = window
export let MODALS = [], TABLES = [], WINDOWS = []
export class Loader{
    constructor(canvas,background,width,height){
        this.ctx = null
        this.angle = 2
        this.num = 0
        this.background = d.querySelector(`.${background}`)
        this.canvas = d.getElementById(`${canvas}`)
        this.width = width
        this.height = height
        this.positionX = 50
        this.positionY = 50
        this.id = null
        this.animate = () => {
            this.draw()
            this.id = requestAnimationFrame(this.animate)
        }
        this.ctx = this.canvas.getContext("2d")
        this.canvas.width = this.width
        this.canvas.height = this.height
    }
    draw(){
        this.ctx.clearRect(0,0,this.width,this.height)
        //FIRST CIRCLE
        this.ctx.beginPath();
        this.ctx.arc(this.positionX, this.positionY, 40, Math.PI, Math.sin(this.num) * Math.PI);
        this.ctx.lineTo(this.positionX, this.positionY);
        this.ctx.fillStyle = '#007bff'
        // this.ctx.fillStyle = 'green'
        this.ctx.fill()
        this.ctx.translate(this.positionX, this.positionY);
        this.ctx.rotate(Math.sin(this.num)*Math.PI/180);
        this.ctx.translate(-this.positionX, -this.positionY);
        this.ctx.closePath();

        //SECOND CIRCLE
        this.ctx.beginPath();
        this.ctx.arc(this.positionX, this.positionY, 40, Math.PI-1, Math.sin(this.num) * Math.PI/4);
        this.ctx.lineTo(this.positionX, this.positionY);
        this.ctx.fillStyle = '#ffc500'
        // this.ctx.fillStyle = '#eeeeee'
        this.ctx.fill()
        this.ctx.translate(this.positionX, this.positionY);
        this.ctx.rotate(Math.sin(this.num)*20*Math.PI/180);
        this.ctx.translate(-this.positionX, -this.positionY);
        this.ctx.closePath();
        this.num += .04
    }
    go(){
        this.background.style.display = "block"
        this.animate()
    }
    stop(){
        this.background.style.display = "none"
        cancelAnimationFrame(this.id)
    }
}
export class XHR{
    constructor(method,url,data = null, filters = null, modal, mode = null){
        this.xhr = new XMLHttpRequest()
        this.method = method
        this.url = url
        this.mode = mode?mode:'response'
        this.data = !data?new FormData():data
        this.filters = !filters?[]:filters
        this.root = ROOT
        this.modal = modal
        this.loader = new Loader("canvas-loader","load",100,100)
    }
    request(callback){
        this.data.append(CSRFNAME,CSRFHASH)
        this.data.append('filters',JSON.stringify(this.filters))
        this.xhr.addEventListener("loadstart",e=>{
            this.loader.go()
        })
        this.xhr.addEventListener("load",e=>{})
        this.xhr.addEventListener("loadend",e=>{
            this.loader.stop()
        })
        this.xhr.upload.addEventListener("",e=>{

        })
        this.xhr.addEventListener("readystatechange",e=>{
            let response = null
            if(e.target.status< 200 || e.target.status >= 300){
                response = e.target.statusText
            }
            if(e.target.readyState == 4){
                if(this.mode === 'responseURL'){
                    response = e.target.responseURL
                    // response = e.target
                }else{
                    response = JSON.parse(e.target.response)
                }
                if(typeof(response.ok)!=='undefined' && !response.ok){
                    this.modal.callback = ()=>{}
                    this.modal.open({title:'Acceso Denegado',message:!response.message?'Ocurrió un error durante la ejecución de la operación. Comuníquese con soporte.':response.message})
                }
                callback(response)
            }
        })
        this.xhr.open(this.method,this.root+this.url,true)
        this.xhr.send(this.data)
    }
}
export class AsyncFetch{
    // constructor(method = 'POST',url,data = null, filters = null, modal = null){
    constructor(params){
        let {method = 'POST',url,data = null, filters = null, modal = null, cover = false} = params
        this.xhr = new XMLHttpRequest()
        this.method = method
        this.url = url
        this.data = !data?new FormData():data
        this.filters = !filters?[]:filters
        this.root = ROOT
        this.modal = modal
        this.result = null
        this.controller = new AbortController()
        this.signal = this.controller.signal
        this.cover = cover
        this.cover_caller = new Loader("canvas-loader","load",100,100)
    }
    request = async ()=>{
        this.data.append(CSRFNAME,CSRFHASH)
        this.data.append('filters',JSON.stringify(this.filters))
        if(this.cover) this.cover_caller.go()
        let init = {
            method:this.method,
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin',
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer',
            body:this.data,
            signal:this.signal
        }
        await fetch(this.root+this.url,init)
        .then(resp=>{
            if(!resp.ok){
                return Promise.reject("Error al procesar la peticion")
            }else{
                if(resp.redirected){
                    this.result = resp.url
                }else{
                    this.result = resp.json()
                }
            }
            if(this.cover) this.cover_caller.stop()
        })
        return this.result
    }
}
export class Events{
    constructor(element,initialEvents = null){
        this.eventElement = element
        this.eventList = {}
        this.loadEvents(initialEvents)
    }
    removeEvent(type,name){
        let eventCallback = Object.entries(this.eventList[type]).filter(fila=>fila[0] == name)[0][1]
        this.eventElement.removeEventListener(type,eventCallback,true)
    }
    restoreEvent(type,name){
        let eventCallback = Object.entries(this.eventList[type]).filter(fila=>fila[0] == name)[0][1]
        this.eventElement.addEventListener(type,eventCallback,true)
    }
    addEvent(type,callback,name){
        this.eventList[type] = {...this.eventList[type], [name]: callback}
        this.eventElement.removeEventListener(type,callback,true)
        this.eventElement.addEventListener(type,callback,true)
    }
    loadEvents(initialEvents){
        if(initialEvents){
            for(let key in initialEvents){
                this.addEvent(key,initialEvents[key],'main')
            }
        }
    }
}
export class HTMLForm{
    constructor(form,parent = null){
        this.form = form
        this.data = null
        this.elements = !form?'':this.form.elements
        this.interface = parent
        this.events = new Events(form,{
            submit: e=>{
                e.preventDefault()
            }
        })
    }
    fill(data = {}){
        let new_elements = 
        this.data = data
        for(let inpt of this.form.elements){
            if(!inpt.hasAttribute('nofill')){
                if((data)[inpt.name]){
                    if(inpt.type === 'file'){
                        let img_content = inpt.closest('.card').querySelector(".card-head")
                        let img_ = document.createElement("img")
                        img_.setAttribute("src",`../imagenez/${(data)[inpt.name]}`)
                        img_.style.height = "100%"
                        img_content.innerHTML = ""
                        img_content.appendChild(img_)
                    }else if(inpt.type === 'radio'){
                        let cheked = document.createAttribute('checked')
                        if(inpt.value === (data)[inpt.name]) inpt.attributes.setNamedItem(cheked)
                    }else if(inpt.type === 'checkbox'){
                        let cheked = document.createAttribute('checked')
                        if((data)[inpt.name] === inpt.value) inpt.attributes.setNamedItem(cheked)
                    }else{
                        inpt.value = (data)[inpt.name]
                    }
                }else{
                    if(typeof (data)[inpt.name] !== 'undefined') inpt.value = ""
                }
            }
        }
    }
    get(){
        let formdata = new FormData(this.element), data = {}
        for(let ele of formdata.entries()){
            data[ele[0]] = ele[1]
        }
        return [data]
    }
    validate(callback){
        if(this.form.checkValidity() === false){
            this.form.classList.add('was-validated')
            this.interface.message(1," Faltan ingresar algunos datos")
        }else{
            this.form.classList.remove('was-validated')
            this.interface.message(0,"")
            callback(this)
        }
    }
    disable(){
        for(let ele of this.elements){
            if(!ele.hasAttribute("disabled")){
                ele.setAttribute("disabled",true)
            }
        }
    }
    undisable(){
        for(let ele of this.elements){
            if(ele.hasAttribute("disabled")){
                ele.attributes.removeNamedItem("disabled")
            }
        }
    }
    clear(){
        this.form.classList.remove('was-validated')
        this.interface.message(0,"")
        this.data = null
        for(let inpt of this.form.elements){
            if(inpt.type !== 'color'){
                inpt.value = ""
            }
        }
    }
}
export class HTMLRepository{
    constructor(options,container = null){
        this.options = options
        this.basedata = []
        this.paginationstate = {
            position:0,
            partitions:100
        }
        this.asyncFetch = null
    }
    populate(params = null,callback = null){
        let {method = null,url = null,fields = null, data = null, filter = null, mode = null, fill = true} = !params?this.options.populate:params
        // if(!this.options.populate) this.options.populate = params
        if(params) this.options.populate = params
        if(!mode || (mode && this.basedata.length < 1)){ 
            let xhr = new XHR(method,url,data,filter);
            xhr.request((response)=>{
                this.basedata = response.result
                if(fill) this.fill(response.result,fields)
                if(callback) callback(this,response.result,filter)
            })
        }else{
            let filtro = [], newbasedata = JSON.parse(JSON.stringify(this.basedata))
            if(Object.keys(this.filters).length > 0){
                newbasedata.forEach((row2,indice)=>{
                    let acumulador = 0
                    Object.keys(this.filters).forEach(key=>{
                        if(!RegExp(this.filters[`${key}`]).exec(row2[`${key}`])){
                            acumulador+=1
                        }
                    })
                    if(!acumulador > 0) filtro[`${indice}`] = row2
                })
            }else{
                filtro = this.basedata
            }
            if(fill) this.fill(filtro,fields)
            if(callback) callback(this)
        }
    }
    extract = async (params = null)=>{
        let {method = null,url = null,fields = null, data = null, filter = null, mode = null, fill = true} = !params?this.options.populate:params
        if(params) this.options.populate = params
        this.container.querySelector(".table_container").scrollTop = 0
        this.container.querySelector(".table_container").scrollLeft = 0
        this.container.classList.add("cover")
        if(!mode || (mode && this.basedata.length < 1)){
            this.asyncFetch = new AsyncFetch({method,url,data,filters:filter,cover:false});
            // this.container.querySelector(".table_container").scrollTop = 0
            // this.container.querySelector(".table_container").scrollLeft = 0
            // this.container.classList.add("cover")
            await this.asyncFetch.request().then(resp=>{
                this.basedata = resp.result
                if(fill) this.fill(resp.result,fields)
                // this.container.classList.remove("cover")
            }).catch(error=>{
                // this.container.classList.remove("cover")
            })
        }else{
            if(fill) this.fill(this.basedata,fields)
        }
        this.container.classList.remove("cover")
        return Promise.resolve(this)
    }
}
export class HTMLVisorDatos extends HTMLRepository{
    constructor(template,windowapp,container,nameid,options,selector){
        super(options,container)
        this.template = template
        this.nameid = nameid
        this.container = container
        this.windowapp = !windowapp?null:windowapp
        this.controls = !options.controls?[false,false]:options.controls
        this.fields = typeof(options.populate) == 'undefined'?[]:options.populate.fields
        this.domdata = undefined     
        this.dataselect = []
        this.filters = {}
        this.static_filters = {}
        this.template.content.querySelector(selector).setAttribute('id',this.nameid)
        this.container.append(this.template.content.cloneNode(true))
        if(this.controls[0]) this.container.querySelector(".search_container").classList.remove("d-none");
        if(this.controls[1]) this.container.querySelector(".controls_container").classList.remove("d-none")
    }
}
export class HTMLCapsule extends HTMLVisorDatos{
    constructor(template,windowapp,container,nameid,options){
        super(template,windowapp,container,nameid,options,'.capsules_container')
        this.capsules = this.windowapp.querySelector(`#${this.nameid}`)
        this.draw()
        this.event()
    }
    draw(params = null){
        let selectData = d.createDocumentFragment()
        this.options = !params?this.options:params
        this.fields.forEach(field=>{
            let $option = d.createElement("option")
            $option.innerHTML = field
            $option.setAttribute('value',field)
            selectData.appendChild($option)
        })
        this.container.querySelector("#controls-fields").innerHTML = ""
        this.container.querySelector("#controls-fields").append(selectData)
    }
    event(){
        this.container.addEventListener("click",e=>{
            if(e.target.closest(".capsula")){
                let capsula = e.target.closest(".capsula"), id = capsula.dataset.id
                this.dataselect = []
                this.dataselect.push(this.basedata[id])
            }
        })
    }
    fill(data = null,fields){
        let capsules = d.createDocumentFragment()
        data.forEach((el,key)=>{
            let capsule = d.querySelector("#capsule_template").content.cloneNode(true), form = capsule.querySelector("form")
            Object.keys(el).forEach(k=>{
                if(Object.keys(form.elements).includes(k)){
                    form.elements[k].value = (k=='faltantes'?el[k]+' días':k=='avance'?el[k]+' %':el[k])
                }
            })
            capsule.querySelector(".progress-time").children[0].style.width = `${el['porcentaje']}%`
            capsule.querySelector(".progress-status").children[0].style.width = `${el['avance']}%`
            capsule.querySelector(".capsula").dataset.id = key
            capsule.querySelector(".capsula").classList.add(`${el['estado'].toLowerCase()}`)
            capsules.appendChild(capsule)
        })
        if(this.fields.length < 1){
            fields.forEach(field=>{
                let $option = d.createElement("option")
                $option.innerHTML = field
                $option.setAttribute('value',field)
                selectData.appendChild($option)
            })
            this.fields = fields
            this.container.querySelector("#controls-fields").innerHTML = ""
            this.container.querySelector("#controls-fields").append(selectData)
        }
        this.capsules.innerHTML = ""
        this.capsules.appendChild(capsules)
    }
}
export class HTMLTable extends HTMLVisorDatos{
    static contadorInstancias = 0
    static instancias = []
    constructor(template,windowapp,container,nameid,options){
        super(template,windowapp,container,nameid,options,'table')
        this.table = this.windowapp.querySelector(`table#${this.nameid}`)
        this.editable = !options.editable?[]:options.editable
        this.multiselect = !options.multiselect?false:options.multiselect
        this.observer = null
        this.events = new Events(container,{
            blur: e=>{
                if(e.target.matches('.editable')){
                    let check_target = e.target.closest("tr").querySelector("input[type='checkbox']")
                    check_target.attributes.removeNamedItem("checked")
                    this.dataselect = this.dataselect.filter((el)=>el.indice!==e.target.parentElement.dataset.indice)
                    e.target.parentElement.attributes.removeNamedItem("select")
                    e.target.parentElement.innerHTML = e.target.value
                }
            },
            keyup: e=>{
                if(e.target.matches("#controls-search") && ((e.keyCode > 40 && e.keyCode < 113) || e.keyCode == 8 || e.keyCode == 32)){
                    let callback = ()=>{
                        let params = this.options.populate, field = (this.container.querySelector("#controls-fields")).value, mode = this.options.populate.mode
                        if(mode !== 'static'){
                            this.filters = {...params.filter,...this.filters}
                        }
                        if(e.target.value !== ''){
                            if(mode === 'static'){
                                this.filters[`${field}`] = `${e.target.value}`
                            }else{
                                this.filters[`${field} like`] = `%${e.target.value}%`
                            }
                        }else{
                            if(Object.keys(this.filters).includes(`${field} like`) || Object.keys(this.filters).includes(`${field}`)){
                                Reflect.deleteProperty(this.filters,`${field} like`)
                                Reflect.deleteProperty(this.filters,`${field}`)
                            }
                        }
                        Object.keys(this.filters).length > 0?params.filter = this.filters:params.filter = []
                        if(this.controls[1]) this.paginationstate.position = 0
                        if(this.options.populate.mode === 'static'){
                            let filtro = [], newbasedata = JSON.parse(JSON.stringify(this.basedata))
                            newbasedata.forEach((row2,indice)=>{
                                let acumulador = 0
                                Object.keys(this.filters).forEach(key=>{
                                    if(!RegExp(this.filters[`${key}`]).exec(row2[`${key}`])){
                                        acumulador+=1
                                    }
                                })
                                if(!acumulador > 0) filtro[`${indice}`] = row2
                            })
                            this.fill(filtro,this.options.populate.fields)
                        }else{
                            if(this.options.populate.afterSearch){
                                this.extract().then(table=>{
                                    this.options.populate.afterSearch(table)
                                })
                            }else{
                                this.extract()
                            }
                        }
                    }
                    if(this.delay){
                        if(this.asyncFetch) this.asyncFetch.controller.abort()
                        clearTimeout(this.delay)
                    }
                    this.delay = setTimeout(callback,400)
                }
            },
            change: e=>{
                if(e.target.matches("#controls-fields")){
                    let controlSearch = this.container.querySelector("#controls-search"), field = e.target.value
                    if(this.options.populate.mode === 'static'){
                        controlSearch.value = Object.keys(this.filters).includes(`${field}`)?this.filters[`${field}`].substr(0,this.filters[`${field}`].length):''
                    }else{
                        controlSearch.value = Object.keys(this.filters).includes(`${field} like`)?this.filters[`${field} like`].substr(1,this.filters[`${field} like`].length - 2):''
                    }
                }
                if(e.target.matches('.editable')){
                    (this.basedata[e.target.parentElement.parentElement.dataset.indice])[e.target.parentElement.dataset.field] = e.target.value
                }
                if(e.target.matches("select[id='partitions']")){
                    let divisions = Math.ceil(this.domdata.length / parseInt(e.target.value))
                    let new_position = divisions >= (this.paginationstate.position + 1) ? this.paginationstate.position : divisions
                    this.pagination({position: new_position,partitions: parseInt(e.target.value)})
                }
            },
            click: e=>{
                if(e.target.matches("#arrow_left")){
                    let {position,partitions} = this.paginationstate
                    if((position - 1) < 0) return 0
                    this.pagination({position: position - 1,partitions: partitions})
                }
                if(e.target.matches("#arrow_right")){
                    let {position,partitions} = this.paginationstate
                    if(Math.ceil(this.domdata.length / partitions) === position + 1) return 0
                    this.pagination({position: position + 1,partitions: partitions})
                }
                if(e.target.matches("#controls-reset, #controls-reset *")){
                    this.filters = {}
                    this.options.populate.filter = this.filters
                    this.extract()
                }
                if(e.target.matches('td')){
                    let attr = d.createAttribute("select"), fila = e.target.parentElement, value = null, check_target = e.target.parentElement.querySelector("input[type='checkbox']")
                    
                    for(let check of this.table.querySelectorAll("input[type='checkbox']")){
                        let row = check.closest("tr")
                        if(check_target === check){
                            if(check_target.hasAttribute("checked") && row.contains(e.target)){
                                let col_select = row.querySelector("td[select]")
                                col_select.attributes.removeNamedItem("select")
                                if(this.editable.length > 0 && this.editable.includes(col_select.dataset.field)){
                                    value = col_select.children[0].value
                                    col_select.innerHTML = value
                                }
                                if(col_select === e.target){
                                    
                                    check_target.attributes.removeNamedItem("checked")
                                    this.dataselect = this.dataselect.filter((el)=>el.indice!==col_select.parentElement.dataset.indice)
                                }else{
                                    e.target.attributes.setNamedItem(attr)
                                }
                            }else{
                                if(!this.multiselect) this.dataselect = []
                                check_target.setAttribute("checked",true)
                                e.target.attributes.setNamedItem(attr)
                                this.dataselect.push({'indice':e.target.parentElement.dataset.indice,'valor':this.basedata[e.target.parentElement.dataset.indice]})
                            }
                        }else{
                            if(check.hasAttribute("checked") && !this.multiselect){
                                let col_selected = row.querySelector("td[select]")
                                check.attributes.removeNamedItem("checked")
                                col_selected.attributes.removeNamedItem("select")
                                if(this.editable.length > 0 && this.editable.includes(col_selected.dataset.field)){
                                    value = col_selected.children[0].value
                                    col_selected.innerHTML = value
                                }
                            }
                        }
                    }
                    if(this.editable.length > 0 && this.editable.includes(e.target.dataset.field)){
                        e.target.innerHTML = `<input class="form-control editable" type='number' data-table='${this.nameid}' step='.001' min='0' value='${e.target.textContent}'/>`
                        e.target.querySelector("input").focus()
                    }
                }
            }
        })
        this.draw()
        HTMLTable.contadorInstancias++ 
        HTMLTable.instancias.push(this)
    }
    static obtenerNumeroInstancias(){
        console.log(HTMLTable.contadorInstancias)
    }
    static obtenerInstancias(){
        console.log(HTMLTable.instancias)
    }
    pagination(params = null){
        let {position,partitions} = params?params:this.paginationstate, new_filas = [], tbodyData = document.createDocumentFragment()
        if(typeof(position) === 'undefined') position = this.paginationstate.position
        if(typeof(position) === 'undefined') partitions = this.paginationstate.position
        if(this.controls[1]){
            new_filas = this.domdata.filter((value,index)=>index >= partitions*position && index < partitions*(position + 1))
            this.container.querySelector("#pagination-info").innerHTML = `${partitions*position + 1}-<span>${partitions*(position + 1)}</span> de <span>${this.domdata.length}</span>`
            this.paginationstate.position = position
            this.paginationstate.partitions = partitions
        }else{
            new_filas = this.domdata
        }
        new_filas.forEach(row=>{
            tbodyData.append(row)
        })
        this.dataselect = []
        this.container.querySelector("tbody").innerHTML = ""
        this.container.querySelector("tbody").append(tbodyData)
    }
    draw(params = null){
        let theadData = d.createDocumentFragment(), $thini = d.createElement("th"), selectData = d.createDocumentFragment()
        $thini.innerHTML = "<input type='checkbox'/>"
        theadData.append($thini)
        this.dataselect = []
        this.options = !params?this.options:params
        this.options.header.forEach(title=>{
            let th = d.createElement("th")
            th.innerHTML = title
            theadData.append(th)
        })
        this.multiselect = !this.options.multiselect?false:this.options.multiselect
        this.fields.forEach(field=>{
            let $option = d.createElement("option")
            $option.innerHTML = field
            $option.setAttribute('value',field)
            selectData.appendChild($option)
        })
        if(typeof(this.options.controls) !== 'undefined'){
            this.options.controls[0]?this.container.querySelector(".search_container").classList.remove("d-none"):this.container.querySelector(".search_container").classList.add("d-none");
            this.options.controls[1]?this.container.querySelector(".controls_container").classList.remove("d-none"):this.container.querySelector(".controls_container").classList.add("d-none");
        }
        this.container.querySelector("#controls-fields").innerHTML = ""
        this.container.querySelector("#controls-fields").append(selectData)
        this.container.querySelector("thead").innerHTML = ""
        this.container.querySelector("thead").append(theadData)
    }
    fill(data = null,fields,filters = null, callback = null){
        let filas = [], tbodyData = d.createDocumentFragment(), selectData = d.createDocumentFragment(), indices = []
        if(!data.length > 0){
            let ddd = d.createElement("td"), $row_ = d.createElement("tr")
            ddd.setAttribute("colspan",fields.length + 1)
            ddd.innerHTML = "<strong>Datos no encontrados</strong>"
            $row_.appendChild(ddd)
            filas.push($row_)
        }else{
            indices = !filters ? Object.keys(data) : Object.keys(data).filter(key=>{
                let acumulador = 0
                filters.forEach(filter =>{
                    if(filter.condicion == '!=='){
                        if(data[key][`${filter.field}`] === filter.value) acumulador++;
                    }else{
                        if(data[key][`${filter.field}`] !== filter.value) acumulador++;
                    }
                })
                return !acumulador>0
            })
        }
        data.forEach((fila,indice)=>{
            let $row = d.createElement("tr"),$tdini = d.createElement("td")
            $tdini.innerHTML = "<input type='checkbox' disabled></input>"
            $row.appendChild($tdini)
            if(indices.map(key=>parseInt(key)).includes(indice)){
                fields.forEach(field=>{
                    let td = d.createElement("td")
                    td.innerHTML = typeof(fila[`${field}`]) == 'undefined'?"<input class='form-control' type='text'/>":fila[`${field}`]
                    td.dataset.field = field
                    $row.append(td)
                    $row.dataset.indice = indice
                })
                filas.push($row)
            }
        })
        if(this.fields.length < 1){
            fields.forEach(field=>{
                let $option = d.createElement("option")
                $option.innerHTML = field
                $option.setAttribute('value',field)
                selectData.appendChild($option)
            })
            this.fields = fields
            this.container.querySelector("#controls-fields").innerHTML = ""
            this.container.querySelector("#controls-fields").append(selectData)
        }
        // filas.forEach(row=>{
        //     tbodyData.append(row)
        // })
        this.domdata = filas
        this.pagination()
        if(callback) callback(this)
        // this.dataselect = []
        // this.container.querySelector("tbody").innerHTML = ""
        // this.container.querySelector("tbody").append(tbodyData)
    }
    spy(config, callback = null){
        this.observer = new MutationObserver((mutationList, observer)=>{
            callback(this,mutationList,observer)
        })
        this.observer.observe(this.table.querySelector("tbody"),config)
    }
    clear(){
        this.basedata = []
        this.domdata = undefined
        this.dataselect = []
        this.options.populate.filter = []
        this.container.querySelector("tbody").innerHTML = ""
    }
    cover(){
        console.log(this.table)
    }
}
export class HTMLWindow{
    constructor(container,nameid,params){
        this.container = container
        this.nameid = nameid
        this.params = params
        this.title = params.title
        this.init = params.init
        this.mode = !params.mode?'collapsed':params.mode
        this.windowcaller = ''
        this.elementcaller = ''
        this.events = new Events(container,{
            click: e=>{
                if(e.target.matches('.close-icon')){
                    this.container.parentElement.classList.add("hide")
                }
                if(e.target.matches('.wapp_title')){
                    console.log(this)
                }
                if(e.target.matches("#cancel_operation")){
                    WINDOWS['w_alert'].open({title:'Mensaje',message:"Está seguro de cancelar la operación en curso?"},w_app=>{
                        w_app.callback = ()=>{
                            if(this.asyncfetch) this.asyncfetch.controller.abort()
                            this.cover(0)
                        }
                    })
                }
            },
            mousedown: e=>{
                if(e.target.matches(".wapp_footer")){
                    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0, container = e.target.parentElement
                    e = e || window.event;
                    e.preventDefault();
                    pos3 = e.clientX;
                    pos4 = e.clientY;
                    d.onmouseup = ()=>{
                        d.onmouseup = null;
                        d.onmousemove = null;
                    }
                    d.onmousemove = (e)=>{
                        e = e || window.event;
                        e.preventDefault();
                        pos1 = pos3 - e.clientX;
                        pos2 = pos4 - e.clientY;
                        pos3 = e.clientX;
                        pos4 = e.clientY;
                        let height = window.getComputedStyle(container).height
                        // console.log(window.getComputedStyle(container).height)
                        container.style.width = parseFloat(container.style.width) - pos1 + "px";
                        container.style.height = parseFloat(container.style.height) - pos2 + "px";
                        // container.style.height = parseFloat(height) - pos2 + "px";
                    }
                }
                if(this.mode == 'collapsed' && !this.container.parentElement.hasAttribute('focus')){
                    this.positioning()
                }
            }

        })
        this.draw()
    }
    close(callback = null){
        if(callback) callback(this)
    }
    draw(params = null, html = null){
        let {mode,title,style} = !params?this.params:params
        if(!mode) mode = 'collapsed'
        if(style){
            Object.keys(style).forEach(key=>{
                this.container.style[key] = style[key]
            })
        }
        // this.wapp_content =  !d.getElementById(`${this.nameid}_tmp`)?d.createTextNode(''):d.getElementById(`${this.nameid}_tmp`).content.cloneNode(true)
        if(html){
            this.container.querySelector('.wapp_main').innerHTML = html
        }else{
            this.wapp_content =  !d.querySelector(`template[id='${this.nameid}_tmp']`)?d.createTextNode(''):d.querySelector(`template[id='${this.nameid}_tmp']`).content.cloneNode(true)
            this.container.querySelector('.wapp_main').innerHTML = ""
            this.container.querySelector('.wapp_main').appendChild(this.wapp_content)
        }
        this.container.parentElement.classList.add(`${mode}`)
        this.container.parentElement.querySelector(".wapp_header > span").innerHTML = `😊 ${title}(<code><em>${this.nameid}</em></code>)`
        this.container.parentElement.querySelector(".wapp_cover").style['height'] = window.getComputedStyle(this.container).height
    }
    positioning(){
        let attr = d.createAttribute('focus'), position = parseInt(this.container.parentElement.style['z-index'])
        d.querySelectorAll(`div.backdrop.${this.mode}:not(.hide)`).forEach(w=>{
            if(w.hasAttribute('focus')) w.attributes.removeNamedItem('focus')
            if(parseInt(w.style['z-index']) > 1 && parseInt(w.style['z-index']) > position) w.style['z-index'] = parseInt(w.style['z-index']) - 1
        })
        this.container.parentElement.style['z-index'] = (d.querySelectorAll(`div.backdrop.${this.mode}:not(.hide)`)).length
        this.container.parentElement.attributes.setNamedItem(attr)
    }
    cover(state = 0, asyncfetch = null){
        this.asyncfetch = asyncfetch
        let progress = this.container.querySelector('.wapp_cover .progress-bar'), button_progress = this.container.querySelector('.wapp_cover #cancel_operation')
        if(state){
            button_progress.classList.remove("btn-danger")
            button_progress.textContent = 'Cargando...'
            button_progress.setAttribute("disabled","true")
            progress.style.width = '1%'
            this.timeload = setInterval(()=>{
                let avance = parseFloat(progress.style.width)
                progress.style.width = `${avance + 5}%`
                if(avance >= 50){
                    if(button_progress.hasAttribute("disabled")){
                        button_progress.textContent = 'Cancelar'
                        button_progress.classList.add("btn-danger")
                        button_progress.attributes.removeNamedItem("disabled")
                    }
                }
            },5000)
            this.container.querySelector('.wapp_cover').classList.remove("hide")
        }else{
            this.container.querySelector('.wapp_cover').classList.add("hide")
            clearInterval(this.timeload)
        }
    }
    execute(params){
        let {method = null,url = null, data = null, filters = null, modal = null} = params
        // let asyncf = new AsyncFetch({method:"POST",url:"db_get_reportes_generator",data})
        // let asyncf = new AsyncFetch({method,url,data})
        // WINDOWS['w_lotemasivo'].cover(1,asyncf)
        // asyncf.request().then(resp=>{
        //     WINDOWS['w_lotemasivo'].container.querySelector(".progress-bar").style.width = "100%"
        //     setTimeout(()=>{
        //         WINDOWS['w_lotemasivo'].cover(0)
        //         w.location.href = resp
        //     },1500)
        // })
    }
}
export class HTMLInterface extends HTMLWindow{
    constructor(container,nameid,params){
        super(container,nameid,params)
        this.tables = []
        this.forms = []
        this.capsules = []
        this.repositories = []
        this.init(this)
    }
    open(callback = null){
        if(!this.container.parentElement.classList.contains("hide")){
            if(this.mode == 'collapsed' && !this.container.parentElement.hasAttribute('focus')){
                this.positioning()
            }
        }else{
            this.container.parentElement.style['z-index'] = (d.querySelectorAll(`div.backdrop:not(.hide)`)).length + 1
            let list_wapp = d.querySelectorAll(`div.backdrop:not(.hide)`),attr = d.createAttribute('focus')
            if(list_wapp.length > 0 && this.mode == 'collapsed'){
                let wapp = WINDOWS[`${list_wapp[list_wapp.length - 1].children[0].id}`]
                this.container.style['top'] = `${parseInt(wapp.container.style['top']) + 50}px`
                this.container.style['left'] = `${parseInt(wapp.container.style['left']) + 50}px`
            }
            d.querySelectorAll(`div.backdrop.${this.mode}:not(.hide)`).forEach(w=>{
                if(w.hasAttribute('focus')) w.attributes.removeNamedItem('focus')
            })
            this.container.parentElement.attributes.setNamedItem(attr)
            this.container.parentElement.classList.remove("hide")
        }
        if(callback) callback(this)
    }
    message(status,message){
        let contain_message = this.container.querySelector(".wapp_footer > div")
        if(status == 0){
            contain_message.classList.remove("alert-warning","show")
        } 
        if(status == 1){
            this.container.classList.add("bouncing")
            contain_message.classList.add("alert-warning","show")
        } 
        contain_message.querySelector(".wapp_footer_message").textContent = message
    }
    reset(){
        this.draw()
        this.init(this)
        this.message(0,"")
    }
}
export class HTMLAlert extends HTMLWindow{
    static template = d.getElementById("mainmodal")
    constructor(container,nameid,type,params){
        super(container,nameid,params)
        this.type = type
        this.callback = ()=>{}
        this.class = null
        this.change()
        this.init(this)
        this.events = new Events(this.container,{
            click: e=>{
                if(e.target.matches("#accept") && this.callback){
                    this.callback()
                    this.container.parentElement.classList.add("hide")
                }
                if(e.target.matches("#cancel")){
                    this.container.parentElement.classList.add("hide")
                }
            },

        })
    }
    change(type = null,message = null){
        let mode = !type?this.type:type
        if(mode == 'warning'){
            this.container.style.backgroundColor = '#fff3cd'
            this.class = "alert-warning"
        }
        if(mode == 'success'){
            this.container.style.backgroundColor = '#d4edda'
            this.class = "alert-success"
        }
        if(mode == 'danger'){
            this.container.style.backgroundColor = '#f8d7da'
            this.class = "alert-danger"
        }
        this.container.querySelector(".alert").classList.add(`${this.class}`)
    }
    write(info){
        this.container.querySelector(".alert-heading").textContent = info.title
        this.container.querySelector(".alert-body").textContent = info.message
    }
    open(info, callback = null){
        this.write(info)
        this.mode == 'collapsed'?this.container.parentElement.style['z-index'] = 1:this.container.parentElement.style['z-index'] = (d.querySelectorAll(`div.backdrop:not(.hide)`)).length + 1
        this.container.parentElement.classList.remove("hide");
        this.container.classList.add("bouncing");
        this.callback = ()=>{}
        if(callback) callback(this)
    }
}
const CargarExcel = async()=>{
    console.log("holal excel")
    // const wb = XLSX.utils.book_new();
    // const ws = XLSX.utils.aoa_to_sheet([["a","b","c"],[1,2,3]]);
    // XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    // XLSX.writeFile(wb, "SheetJSESMTest.xlsx");

    // const url = "https://sheetjs.com/data/PortfolioSummary.xls";
    const url = "../operaciones_next/plantillas/inventario_consolidado3.xlsx";
    const file = await (await fetch(url)).arrayBuffer();
    const workbook = XLSX.read(file);
    // XLSX.writeFile(workbook, "Presidents.xlsx", { compression: true });
    XLSX.writeFile(workbook, "Presidents.xlsx");
}
export default CargarExcel

// Provider=MSDASQL.1;Persist Security Info=True;User ID=facturador_seguro;Mode=Read;Extended Properties="User=facturador_seguro;Password=JSJ@1984+-+;Driver=MySQL ODBC ANSI 8.0 Driver;Server=jsjfact.com;Database=BD_FACTURADOR;";Initial Catalog=BD_FACTURADOR

// NEW SQL ODBC 8.0
// Provider=MSDASQL.1;Persist Security Info=True;User=facturador_seguro;Extended Properties="DRIVER=MySQL ODBC 8.1 ANSI Driver;SERVER=jsjfact.com;DATABASE=BD_FACTURADOR;USER=facturador_seguro;OPTION=3;";Password=**********