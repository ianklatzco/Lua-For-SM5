import React, { Component } from "react"
import { NavLink } from "react-router-dom"
import $ from "jquery"

class GuidesSidebar extends Component {

	componentDidMount(){
		[1,2,3,4,5].forEach(function(i){
			const el = $("#collapse-" + i)
			const listitem_anchors = el.find('li a')

			listitem_anchors.each(function(j, anchor){
				if ($(anchor).hasClass("active")){
					// ensure the proper bootstrap accordion section is open
					el.addClass("show")
					// ensure the proper styling rules are applied to accordion section header
					$("#heading-" + i + " h5 a").removeClass("collapsed")
				}
			})
		});
	}

	render() {
		return (
			<div id="GuidesSidebar">
				<div>
					<div id="heading-1">
						<h5>
							<NavLink to="#" className="collapsed" data-toggle="collapse" data-target="#collapse-1" aria-expanded="false" aria-controls="collapse-1">
								Introduction
							</NavLink>
						</h5>
					</div>

					<div id="collapse-1" className="collapse" aria-labelledby="heading-1" data-parent="#sidebar">
						<ul>
							<li><NavLink to="/foreword">What Are Actors?</NavLink></li>
							<li><NavLink to="/lua">Lua changes from SM3.95</NavLink></li>
							<li><NavLink to="/Supported-File-Extensions">Supported File Extensions</NavLink></li>
							<li><NavLink to="/Mod-Chart-Setup">Setting Up a "Mod" Chart</NavLink></li>
						</ul>
					</div>
				</div>


				<div>
					<div id="heading-2">
						<h5>
							<NavLink to="#" className="collapsed" data-toggle="collapse" data-target="#collapse-2" aria-expanded="false" aria-controls="collapse-2">
								Actors
							</NavLink>
						</h5>
					</div>
					<div id="collapse-2" className="collapse" aria-labelledby="heading-2" data-parent="#sidebar">
				      <ul>
							<li><NavLink to="/Def.Quad">Quad</NavLink></li>
							<li><NavLink to="/Def.BitmapText">BitmapText</NavLink></li>
							<li><NavLink to="/Def.Sprite">Sprite</NavLink></li>
							<li><NavLink to="/Def.Actor">Actor</NavLink></li>
							<li><NavLink to="/LoadActor">LoadActor()</NavLink></li>
							<li><NavLink to="/Def.Sound">Sound</NavLink></li>
							<li><NavLink to="/Def.Model">Model</NavLink></li>
							<li><NavLink to="/Def.ActorMultiVertex">ActorMultiVertex</NavLink></li>
							<li><NavLink to="/Def.ActorFrameTexture">ActorFrameTexture</NavLink></li>
				      </ul>
					</div>
				</div>


			  <div>
			    <div id="heading-3">
			      <h5>
			        <NavLink to="#" className="collapsed" data-toggle="collapse" data-target="#collapse-3" aria-expanded="false" aria-controls="collapse-3">
			          Singletons
			        </NavLink>
			      </h5>
			    </div>
			    <div id="collapse-3" className="collapse" aria-labelledby="heading-3" data-parent="#sidebar">
						<ul>
							<li><NavLink to="/SCREENMAN">SCREENMAN</NavLink></li>
							<li><NavLink to="/SOUND">SOUND</NavLink></li>
						</ul>
			    </div>
			  </div>



			  <div>
			    <div id="heading-4">
			      <h5>
			        <NavLink to="#" className="collapsed" data-toggle="collapse" data-target="#collapse-4" aria-expanded="false" aria-controls="collapse-4">
			          Best Practices
			        </NavLink>
			      </h5>
			    </div>
					<div id="collapse-4" className="collapse" aria-labelledby="heading-4" data-parent="#sidebar">
						<ul>
							<li><NavLink to="/Debugging">Debugging</NavLink></li>
							<li><NavLink to="/Command-Chaining">Command Chaining</NavLink></li>
						</ul>
					</div>
			  </div>


			  <div>
			    <div id="heading-5">
			      <h5>
			        <NavLink to="#" className="collapsed" data-toggle="collapse" data-target="#collapse-5" aria-expanded="false" aria-controls="collapse-5">
			          Examples
			        </NavLink>
			      </h5>
			    </div>
			    <div id="collapse-5" className="collapse" aria-labelledby="heading-5" data-parent="#sidebar">
						<ul>
							<li><NavLink to="/Arbitrary-Input">Handling Arbitrary Input</NavLink></li>
							<li><NavLink to="/Simple-Tweens">Simple Tweens</NavLink></li>
						</ul>
			    </div>
			  </div>
			</div>
		)
	}
}

export default GuidesSidebar