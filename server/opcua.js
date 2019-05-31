module.exports = function HURON () {

const opcua = require("node-opcua"); 
const async = require("async");
const openSocket = require('socket.io-client');




var nodesub = "ns=2;s=Huron_CNC.Position"

const endpointUrl = "opc.tcp://132.246.138.160:49330"
const socket = openSocket('ws://localhost:4001');

const client = new opcua.OPCUAClient();
let the_session, the_subscription;

var nodes = []

var userIdentity = {
      userName: 'nrc',
      password: 'nrc'
};

 var nodesArr =[]
/*_________________________________________________________*/

function dataObj(nodeId, value){
	this.nodeId = nodeId,
	this.value = value
}

/*_________________________________________________________*/


	async.series([

	    // step 1 : connect to
	    function(callback)  {

			client.connect(endpointUrl, function (err) {
			    if(err) {
			        console.log(" cannot connect to endpoint :" , endpointUrl );
			    } else {
			        console.log("connected !");
			    }
			    callback(err);
			});
	    
	    },

	    // step 2 : createSession
	    function(callback) {
			client.createSession(userIdentity,function(err, session) {
			    if(!err) {
			        the_session = session;
			    }
			    callback(err);
			});
	    
	    },

	    // step 3 : browse
	    function(callback) {
	    	console.log("*************BROWSE************")
			the_session.browse(nodesub, function(err, browseResult) {
			    if(!err) {
			    	if(browseResult.statusCode.name == 'Good')
			    	{
			    		console.log('Good Path')
				        	browseResult.references.forEach( (node)=> {
				         //   	nodesArr.push(new nodeObj ((node.nodeId.toString())))
				         		nodesArr.push((node.nodeId.toString()))
			    		})
			    	}
			    }else {
			    	console.log("Bad Path")
			    }

			    
			    console.log(nodesArr);
			    console.log("*************BROWSE************")
			    callback(err);
			});
	    },

	 
	  //   // step 5: install a subscription and install a monitored item for 10 seconds
	    function(callback) {
	    	console.log('subscribe')
			//subnode = node.slice(7)
			the_subscription=new opcua.ClientSubscription(the_session, {
		    requestedPublishingInterval: 1000,
		    requestedLifetimeCount: 10,
		    requestedMaxKeepAliveCount: 2,
		    maxNotificationsPerPublish: 10,
		    publishingEnabled: true,
		    priority: 10
		});

		the_subscription.on("started", function() {
		    console.log("subscription started for 2 seconds - subscriptionId=",the_subscription.subscriptionId);
		}).on("keepalive", function() {
		    console.log("keepalive");
		}).on("terminated", function() {
		   console.log("terminated");
		});

	
		// setTimeout( function() {
		//     the_subscription.terminate(callback);
		// }, 10*1000);

		// install monitored item
/*____________________________________________________________________________________________*/

/*____________________________________________________________________________________________*/

	//Add initial state vlaue fetch 

/*____________________________________________________________________________________________*/

		nodesArr.forEach( (node)=> {

			var status;
			var monitoredItem  = the_subscription.monitor(
				{
			        nodeId: node,
			        attributeId: opcua.AttributeIds.Value
			    },
			    {
			        samplingInterval: 1000,
			        discardOldest: true,
			        queueSize: 10
			    },
			    opcua.read_service.TimestampsToReturn.Both

			    )

				// monitoredItem.on("initialized", (initValue)=> {
			 //    console.log("____________________________INIT____________________________________")
			 //    console.log(monitoredItem.itemToMonitor.nodeId.value.toString(), '=', initValue.value.value)
				// })

				monitoredItem.on("changed", (dataValue)=> {
					var nodeId = (monitoredItem.itemToMonitor.nodeId.value.toString());
						value =  dataValue.value.value

				    // console.log("_____________________________NEW___________________________________")
				    // console.log(nodeId, '=', value)

			    	socket.emit('newData', new dataObj(nodeId, value))

				})
				//return dataValue.statusCode

		})
		
/*____________________________________________________________________________________________*/

	},

	    // close session
	    function(callback) {
			the_session.close( function(err) {
			    if(err) {
			        console.log("closing session failed ?");
			    }
			    callback();
			});
	    }

	],

	function(err) {
	    if (err) {
	        console.log(" failure ",err);
	    } else {
	        console.log("done!");
	    }
	    client.disconnect(function(){});
	})


}

