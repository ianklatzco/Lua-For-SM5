import React, { Component } from "react";

import ActorClass from "./ActorClass"
import ActorMethod from "./ActorMethod"
import Namespace from "./Namespace"
import NamespaceMethod from "./NamespaceMethod"
import LuaAPIFilter from "./LuaAPIFilter"

import $ from "jquery";
import "../_styles/api.css";

class LuaAPI extends Component {

	constructor(props){
		super()

		this.state = {
			isLoaded: false,

			mobile_api_filter: "",

			visible_categories: {
				"Actors": true,
				"Namespaces": true,
				"Enums": true,
				"Singletons": true,
				"GlobalFunctions": true,
				"Constants": true
			}
		}

		// maintain a handle on this class to be used within the functions below
		const lua_api = this

		// a pojo containing just the actor class names as keys
		// used for lookup purposes in getReturnValue()
		this.actor_class_names = {}

		// ensure that the following functions have access to "this"
		this.filterResults= this.filterResults.bind(this)
		this.getReturnValue = this.getReturnValue.bind(this)
		this.handleFilterChangeMobile = this.handleFilterChangeMobile.bind(this)

		// ---------------------------------------------------------------------

		const get_base = function(actors_with_base, actor_class){
			const _class = $(actors_with_base).find("Class[name='" + actor_class + "']")

			if (_class[0] && _class[0].attributes.base){
				const base = _class[0].attributes.base.textContent
				return " : <a href='#Actors-" + base + "'>" + base + "</a>"
			}
			return null
		}

		// some method descriptions contain <Link /> elements, intended to serve
		// as anchors to elsewhere within the document
		// we need to find and replace them with html-compliant anchors
		const check_for_links = function(method){

			const class_is_a_namespace = function(_class){
				for (let i=0; i < lua_api.namespaces.length; i++){
					if (lua_api.namespaces[i]===_class){ return true }
				}
				return false
			}


			const trimmed_innerHTML = method.innerHTML.trim()

			// first, attempt to handle <Link>text</Link> elements
			let _matches = trimmed_innerHTML.match(/(<\s*link[^>]*>)(.*?)<\s*\/\s*link>/i)
			if (_matches){
				let anchors = []

				_matches.forEach(function(_match){
					const text = _matches[2]
					const _link = $.parseHTML(_matches[1])
					let _class = _link[0].attributes.getNamedItem("class")
					_class = _class && _class.nodeValue
					const _function = _link[0].attributes.getNamedItem("function").nodeValue

					if (_class){
						if (_class === "ENUM"){
							if (_function){
								// create the anchor string for this Enum
								const anchor = "<a href='#Enums-" + _function + "'>" + text + "</a>"
								anchors.push(anchor)
							}
						} else if (class_is_a_namespace(_class)) {
							// create the anchor string for this Lua Namespace
							const anchor = "<a href='#Namespaces-" + _class + "-" + _function + "'>" + text + "</a>"
							anchors.push(anchor)

						} else {
							if (_function){
								// create the anchor string for this Actor Class
								const anchor = "<a href='#Actors-" + _class + "-" + _function + "'>" + text + "</a>"
								anchors.push(anchor)
							}
						}
					} else {

						// It was possible in LuaDocumentation.xml to create <Link> to some other method
						// within the current Actor Class with a compact syntax like <Link function="zoomy"/>
						// Unfortunately, that leaves us trying to figure out what the "current Actor Class" is
						// in the context of this React app.  We'll get the parentNode of the method object.
						const _parent_class = method.parentNode.nodeName

						if (_parent_class === "GlobalFunctions"){
							const anchor = "<a href='#GlobalFunctions-" + _function + "'>" + text + "</a>"
							anchors.push(anchor)
						}
					}
				})

				let _i = 0
				// substitute each new anchor string for the appropriate old <Link>text</Link>
				return trimmed_innerHTML.replace(/<\s*link[^>]*>.*?<\s*\/\s*link>/i, function(match){
					return anchors[_i++]
				})
			}

			// next, attempt to handle <Link /> elements
			_matches = trimmed_innerHTML.match(/<\s*link[^>]*\/>/ig)
			if (_matches){
				let anchors = []

				_matches.forEach(function(_match){

					const _link = $.parseHTML(_match)
					let _class = _link[0].attributes.getNamedItem("class")
					_class = _class && _class.nodeValue
					let _function = _link[0].attributes.getNamedItem("function")
					_function = _function && _function.nodeValue

					if (_class){
						if (_class === "ENUM"){
							if (_function){
								// create the anchor string for this Enum
								const anchor = "<a href='#Enums-" + _function + "'>" + _function + "</a>"
								anchors.push(anchor)
							}
						} else if (_class === "GLOBAL"){
							if (_function){
								// create the anchor string for this Global Function
					 			const anchor = "<a href='#GlobalFunctions-" + _function + "'>" + _function + "</a>"
								anchors.push(anchor)
							}
						} else {

							if (_function){
								// create the anchor string for this Actor Class
								const anchor = "<a href='#Actors-" + _class + "-" + _function + "'>" + _class +  "." + _function + "</a>"
								anchors.push(anchor)
							} else {
								const anchor = "<a href='#Actors-" + _class + "'>" + _class + "</a>"
								anchors.push(anchor)
							}
						}
					} else {
						// It was possible in LuaDocumentation.xml to create <Link> to some other method
						// within the current Actor Class with a compact syntax like <Link function="zoomy"/>
						// Unfortunately, that leaves us trying to figure out what the "current Actor Class" is
						// in the context of this React app.  We'll get the parentNode of the method object.
						const _parent_class = method.parentNode.attributes.getNamedItem("name").nodeValue
						const anchor = "<a href='#Actors-" + _parent_class + "-" + _function + "'>" + _parent_class +  "." + _function + "</a>"
						anchors.push(anchor)
					}

				})

				// temp variable used within the replace() function below in the event of multiple replaces being needed
				let _i = 0
				// substitute each new anchor string for the appropriate old <Link>text</Link>
				return trimmed_innerHTML.replace(/<\s*link[^>]*\/>/gi, function(match){
					return anchors[_i++]
				})
			}

			// otherwise, no <Link> elements were found, so just return the method description
			return trimmed_innerHTML
		}

		// ---------------------------------------------------------------------

		$.ajax({
			url: "./API/LuaDocumentation.xml"

		}).done(function(lua_documentation){

			$.ajax({
				url: "./API/Lua.xml"
			}).done(function(lua_dot_xml){

				// We have two xml files to retrieve data from, lua_documentation and lua_dot_xml
				// I don't fully understand why the documentation is split across them the way it is,
				// but it doesn't really matter, we just have to know where to look for what.

				// Actor classes are *mostly* described in LuaDocumentation.xml, but the "base" class of each
				// is actually defined in Lua.xml.  We'll need to combine the two data sources.
				const actors_with_base = $(lua_dot_xml).children()[0].children[1]
				const actor_classes = Array.from($(lua_documentation).children().find("Classes Class"))

				const namespaces = Array.from($(lua_documentation).children().find("Namespaces Namespace"))
				const enums = Array.from($(lua_dot_xml).children().find("Enums Enum"))
				const singletons = Array.from($(lua_dot_xml).children().find("Singletons Singleton"))
				const global_functions = Array.from($(lua_documentation).children().find("GlobalFunctions Function"))
				const constants = Array.from($(lua_dot_xml).children().find("Constants Constant"))


				// actor classes, namespaces, enums, singletons, global functions, constants
				let data = [ [], [], [], [], [], [] ]

				// ---------------------------------------------------------------------
				// first, populate the actor_class_names object with the names of each actor class
				// we'll need this to check against in the next forEach loop below
				const actor_class_names = {}

				actor_classes.forEach(function(actor_class){
					actor_class_names[actor_class.attributes.name.textContent] = true
				})

				// retain the actor_class_names object as state so we can refer to it in getReturnValue()
				lua_api.actor_class_names = actor_class_names

				// include the SM5 Lua Namespace names for convenience, too
				lua_api.namespaces = namespaces.map(function(namespace){
					return namespace.attributes[0].nodeValue
				})

				// now, do the "heavy lifting"
				// ---------------------------------------------------------------------
				// process each actor_class...
				actor_classes.forEach(function(actor_class){

					let unsorted_methods = Array.from($(actor_class).find("Function"))

					// ... sorting each actor class's methods alphabetically, in a case-insensitive manner ...
					unsorted_methods.sort(function(a,b){
						// I'm pretty sure all the text I'm sorting here falls within the ASCII range of 32-126
						// otherwise, I might not be able to rely on doing greater-than less-than comparisons like this
						// for discussion, see: https://stackoverflow.com/q/14677060
						if (a.attributes.name.textContent.toUpperCase() < b.attributes.name.textContent.toUpperCase()){ return -1}
						if (a.attributes.name.textContent.toUpperCase() > b.attributes.name.textContent.toUpperCase()){ return 1}
						return 0
					})

					// ... and get just the method data we want (name, return, args, description) for each method
					const sorted_methods = unsorted_methods.map(function(method, i){
						return {
							name: method.attributes.name.textContent,
							return: lua_api.getReturnValue(method.attributes.return.textContent),
							arguments: method.attributes.arguments.textContent,
							desc: check_for_links(method)
						}
					})

					// push a new object representing this actor_class to the overall data array
					data[0].push({
						name: actor_class.attributes.name.textContent,
						base: get_base(actors_with_base, actor_class.attributes.name.textContent),
						methods: sorted_methods
					})
				})

				// ---------------------------------------------------------------------
				// next, process each namespace...
				namespaces.forEach(function(namespace){
					const _methods = Array.from($(namespace).find("Function"))
					const methods = _methods.map(function(method, i){
						return {
							name: method.attributes.name.textContent,
							return: lua_api.getReturnValue(method.attributes.return.textContent),
							arguments: method.attributes.arguments.textContent,
							desc: check_for_links(method)
						}
					})

					data[1].push({
						name: namespace.attributes.name.textContent,
						methods: methods
					})
				})

				// ---------------------------------------------------------------------
				// next, process each enum...
				enums.forEach(function(e){
					const _values = Array.from($(e).find("EnumValue"))
					const values = _values.map(function(v, i){
						return {
							name: v.attributes.name.textContent,
							value: v.attributes.value.textContent
						}
					})

					data[2].push({
						name: e.attributes.name.textContent,
						values: values
					})
				})

				// ---------------------------------------------------------------------
				// almost done now; process each singleton...
				singletons.forEach(function(s){
					data[3].push({
						name: s.attributes.name.textContent,
						actor_class: s.attributes.class.textContent
					})
				})

				// ---------------------------------------------------------------------
				// almost done! process each global function...
				global_functions.forEach(function(f){
					data[4].push({
						name: f.attributes.name.textContent,
						return: f.attributes.return.textContent,
						arguments: f.attributes.arguments.textContent,
						desc: check_for_links(f)
					})
				})

				// ---------------------------------------------------------------------
				// finally! process each Lua constant, and we're done
				constants.forEach(function(c){
					data[5].push({
						name: c.attributes.name.textContent,
						value: c.attributes.value.textContent
					})
				})

				// ---------------------------------------------------------------------
				// cache all render-able elements now so that we don't need to constantly recompute them
				lua_api.all_elements = lua_api.get_elements_to_render(data)

				// ---------------------------------------------------------------------
				// we're out of the "heavy lifting" forEach loop; it's time to setState
				lua_api.setState({
					isLoaded: true,
					actor_classes: data[0],
					namespaces: data[1],
					enums: data[2],
					singletons: data[3],
					global_functions: data[4],
					constants: data[5]
				})

				// scroll the page to the appropriate y-offset if needed
				lua_api.scroll_window_after_hashchange()

				// ensure that future hashchanges scroll the appropriate amount, too
				window.addEventListener("hashchange", function(e){
					lua_api.scroll_window_after_hashchange()
				})
			})
		})
	}

	scroll_window_after_hashchange(){
		// now that the data has been retrieved, parsed, and injected into the document,
		// check the url string for a hash and scroll the window to the appropriate y-offset
		const window_hash = window.location.hash.replace("#","")
		if (window_hash) {
			const el = document.getElementById(window_hash)
			if (el){
				const y_offset = el.offsetTop
				if (y_offset){
					const topbar_height = 75
					window.scrollTo(0, y_offset-topbar_height)
				}
			}
		}
	}

	get_elements_to_render(classes_to_render){

		return {
			"Actors": classes_to_render[0].map(function(actor, i){
				const methods = actor.methods.map(function(method, j){
					return <ActorMethod actor={actor} method={method} key={actor.name + "-" + method.name + j} />
				})
				return <ActorClass actor={actor} methods={methods} key={actor.name} />
			}),

			"Namespaces": classes_to_render[1].map(function(n, i){
				const methods = n.methods.map(function(method, j){
					return <NamespaceMethod namespace={n} method={method} key={n.name + "-" + method.name + j} />
				})
				return <Namespace namespace={n} methods={methods} key={n.name} />
			}),

			// the Enums are simple enough to not warrant full React components; just handle them here
			"Enums": classes_to_render[2].map(function(e, i){

				const values = e.values.map(function(_e, j){
					return( <tr key={"enum-"+e.name+"-"+_e.name+"-"+j}><td>{_e.name}</td><td>{_e.value}</td></tr> )
				})
				return (
					<table id={"Enums-" + e.name} className="table table-hover table-sm table-bordered" key={"enum-"+e.name}>
						<thead className="table-primary"><tr><th><strong>{e.name}</strong></th><th style={{width:15+"%"}}>Value</th></tr></thead>
						<tbody>{values}</tbody>
					</table>
				)
			}),


			"Singletons": (
				<ul id="Singletons">
					{classes_to_render[3].map(function(s, i){
						return(<li key={"singleton-"+s.name}><a href={"#Actors-"+s.actor_class}>{s.name}</a></li>)
					})}
				</ul>
			),

			"GlobalFunctions":(
				<div className="GlobalFunctions actor-class">

				{classes_to_render[4].map(function(f, i){
					return(
						<div id={"GlobalFunctions-" + f.name} className="method" key={"GlobalFunction-"+f.name+"-"+i}>
							<div className="method-signature">
								{f.name}
								(<code>{f.arguments}</code>)
							</div>

							<span className="method-return"><em>return: </em> <span dangerouslySetInnerHTML={{__html: f.return}} />  </span>
							<span className="method-description" dangerouslySetInnerHTML={{ __html: f.desc }} />
						</div>
					)
				})}
				</div>

			),

			"Constants": (
					<table id={"Constants"} className="table table-hover table-sm table-bordered">
						<thead className="table-primary"><tr><th><strong>Lua Variable</strong></th><th>Value</th></tr></thead>
						<tbody>
							{classes_to_render[5].map(function(c, i){
								return(
									<tr key={"constant-"+c.name}>
										<td>{c.name}</td>
										<td>{c.value}</td>
									</tr>
								)
							})}
						</tbody>
					</table>
			)
		}
	}


	// a helper function to determine whether the "return" type of each API method
	// should be static text or an anchor linking to elsewhere in the document
	getReturnValue(r){
		// if the return text for this method exactly matches "void" just use that
		if (r === "void"){ return r }

		// next, check to see if the return text matches any of the actor classes
		if (this.actor_class_names[r]){
			return "<a href='#Actors-" + r +"'>" + r + "</a>"
		}

		// maybe this method's return value is an Actor wrapped in curly braces
		// indicating that this method returns a table of Actors
		// (though, it could also be "float" wrapped in curly braces,
		// which we don't want to try to try to create an anchor to)
		const _r = r.match(/{(.+)}/)
		if (_r && this.actor_class_names[_r[1]]){
			return "{ <a href='#Actors-" + _r[1] +"'>" + _r[1] + "</a> }"
		}

		// otherwise, we have something like "bool" or "int"; just return it
		return r
	}


	// -----------------------------------------------------------------------------------------
	// API TEXT FILTER
	// -----------------------------------------------------------------------------------------


	// this methods exists to handle the text-input field that appears in mobile layout
	handleFilterChangeMobile(eventValue){
		this.setState({mobile_api_filter: eventValue})
	}

	filterResults(eventValue){

		let results = [ [], [], [], [], [], [] ]

		// ---------------------------------------------------------------------
		// loop through all actor classes stored in state, searching for string matches in various ways
		this.state.actor_classes.forEach(function(actor){

			// if name of this entire actor class includes the user-input string,
			// OR if the base of this actor class includes the user-input string
			if (actor.name.toUpperCase().includes(eventValue) || (actor.base && actor.base.toUpperCase().includes(eventValue))){
				// push the entire actor class and all its methods to the array of filtered results
				results[0].push(actor)
				// and continue to the next actor class
				return
			}

			// otherwise, loop through the methods available to this actor, using
			// filter() to reduce a larger array to a smaller array of filtered results
			const filtered_methods = actor.methods.filter(function(method){
				// check for case-insensitive strings matches on the method name or description
				// if either is a match, return true, which means this method passes the filter()
				// test and will be included in the pared down filtered_methods array
				return (method.name.toUpperCase().includes(eventValue) || method.desc.toUpperCase().includes(eventValue))
			})

			// if any matches were found above, filtered_methods will contain those methods
			// for this actor, so push them to the results array now so that they'll persist
			// outside of this iteration of the forEach loop
			if (filtered_methods.length > 0){
				results[0].push({
					name: actor.name,
					methods: filtered_methods
				})
			}
		})

		// ---------------------------------------------------------------------
		// loop through all namespaces stored in state, searching for string matches in various ways
		this.state.namespaces.forEach(function(n){

			// if name of this entire actor class includes the user-input string
			if (n.name.toUpperCase().includes(eventValue)){
				// push the entire namespace and all its methods to the array of filtered results
				results[1].push(n)
				// and continue to the next namespace
				return
			}

			// otherwise, loop through the methods available to this namespace, using
			// filter() to reduce a larger array to a smaller array of filtered results
			const filtered_methods = n.methods.filter(function(method){
				// check for case-insensitive strings matches on the method name or description
				// if either is a match, return true, which means this method passes the filter()
				// test and will be included in the pared down filtered_methods array
				return (method.name.toUpperCase().includes(eventValue) || method.desc.toUpperCase().includes(eventValue))
			})

			// if any matches were found above, filtered_methods will contain those methods
			// for this namespace, so push them to the results array now so that they'll persist
			// outside of this iteration of the forEach loop
			if (filtered_methods.length > 0){
				results[1].push({
					name: n.name,
					methods: filtered_methods
				})
			}
		})

		// ---------------------------------------------------------------------
		// loop through all enums stored in state, searching for string matches in various ways
		this.state.enums.forEach(function(e){
			if (e.name.toUpperCase().includes(eventValue)){
				results[2].push(e)
				return
			}

			const filtered_enums = e.values.filter(function(val){
				return (val.name.toUpperCase().includes(eventValue))
			})

			if (filtered_enums.length > 0){
				results[2].push({
					name: e.name,
					values: filtered_enums
				})
			}
		})

		// ---------------------------------------------------------------------
		// loop through all enums stored in state, searching for string matches
		this.state.singletons.forEach(function(s){
			if (s.name.toUpperCase().includes(eventValue)){
				results[3].push(s)
				return
			}
		})

		// ---------------------------------------------------------------------
		// loop through all global functions stored in state, searching for string matches
		this.state.global_functions.forEach(function(f){
			if (f.name.toUpperCase().includes(eventValue) || f.desc.toUpperCase().includes(eventValue)){
				results[4].push(f)
				return
			}
		})

		// ---------------------------------------------------------------------
		// loop through all constants stored in state, searching for string matches
		this.state.constants.forEach(function(c){
			if (c.name.toUpperCase().includes(eventValue)){
				results[5].push(c)
				return
			}
		})

		return results
	}

	// -----------------------------------------------------------------------------------------
	// -----------------------------------------------------------------------------------------


	// toggle the show/hide of major categories of the API
	handleCategoryClick(category, e){
		// get all categories from state
		var categories = {...this.state.visible_categories}
		// flip the visibility boolean for the desired category
		categories[category] = !(this.state.visible_categories[category])
		// it seems it's not possible to directly set the state of a nested property,
		// so update state for the entire visible_categories object
		this.setState({visible_categories: categories})
		// toggle the "collapsed" class so CSS can append the appropriate UI triangle
		$("#" + category).toggleClass("collapsed")
	}


	render() {
		if (this.state && this.state.isLoaded && this.props){

			let elements = null

			if (this.props.api_filter === "" && this.state.mobile_api_filter === ""){
				elements = this.all_elements

			} else {
				const eventValue = this.props.api_filter !== "" ? this.props.api_filter : this.state.mobile_api_filter
				elements = this.get_elements_to_render(this.filterResults(eventValue))
			}

			// by default there are 24 constants, but text filtering may result in fewer or none
			// store the curent number of constants in num_constants now and use it below
			// to determine whether to show/hide the header for the constants table
			// (having a table header with 0 rows of data is confusing)
			const num_constants = elements.Constants.props.children[1].props.children.length

			return (
				<div className="LuaAPI">

					<p className="alert alert-info">
						This version of SM5&apos;s Lua API is in beta, so some information may be missing!
						<br /><br />
						The original, full API can <a href="/Lua-For-SM5/API/Lua.xml">still be accessed here</a>.
					</p>


						<div className="d-md-none">
							<LuaAPIFilter onFilterChange={this.handleFilterChangeMobile} />
							<hr />
						</div>


					<h1>SM5 Lua API</h1>

					<h2 id="Actors" className="API-Category" onClick={(e) => this.handleCategoryClick("Actors", e)}>Actor Classes</h2>
					<div>{this.state.visible_categories["Actors"] && elements["Actors"]}</div>

					<h2 id="Namespaces" className="API-Category" onClick={(e) => this.handleCategoryClick("Namespaces", e)}>Namespaces</h2>
					<div>{this.state.visible_categories["Namespaces"] && elements["Namespaces"]}</div>

					<h2 id="Enums" className="API-Category" onClick={(e) => this.handleCategoryClick("Enums", e)}>Enums</h2>
					<div>{this.state.visible_categories["Enums"] && elements["Enums"]}</div>

					<h2 id="Singletons" className="API-Category" onClick={(e) => this.handleCategoryClick("Singletons", e)}>Singletons</h2>
					<div>{this.state.visible_categories["Singletons"] && elements["Singletons"]}</div>

					<h2 id="GlobalFunctions" className="API-Category" onClick={(e) => this.handleCategoryClick("GlobalFunctions", e)}>Global Functions</h2>
					<div>{this.state.visible_categories["GlobalFunctions"] && elements["GlobalFunctions"]}</div>

					<h2 id="Constants" className="API-Category" onClick={(e) => this.handleCategoryClick("Constants", e)}>Constants</h2>
					<div>{this.state.visible_categories["Constants"] && num_constants > 0 && elements["Constants"]}</div>
				</div>
			)
		} else {
			return null
		}
	}
}

export default LuaAPI;