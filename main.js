// Types of players
var P1 = 'X', P2 = 'O';
var socket; 
var	player;
var	game;
var connectionsLen;


var message = function(type, content) {
	return {
		'type': type,
		'content': content
	};
};

var sendMsg = function(msg) {
	var s = JSON.stringify(msg);
	socket.send(s);
};
  
var handleServerMessage = function(event){
	var msg = JSON.parse(event.data);

	if (msg.type == 'roomCreated'){
		//console.log(msg.content);
		var data = JSON.parse(msg.content); 
		var message = 'Hello, ' + data.name + 
		'. Please ask your friend to join the Game. Waiting for player 2...';
		
		$('.menu').css('display', 'none');
		$('.greeting').css('display', 'block');
		$('#userHello').html(message);
		player.setCurrentTurn(true);
	};
	
	if (msg.type == 'player1'){
		//console.log(msg.content)
		var data = JSON.parse(msg.content);
		var greeting = `Hello, ${player.getPlayerName()}`;
		$('#userHello').html(greeting);
		game = new Game();
		game.displayBoard(greeting);
		player.currentTurn = true;
		//console.log(player);
	};
 
	if (msg.type == 'player2'){
		//console.log(msg.content);
		var data = JSON.parse(msg.content);	
		var greeting = `Hello, ${data.name}`;
		game = new Game();
		game.displayBoard(greeting);
		player.currentTurn = false;
		//console.log(player);
	};
	
	if (msg.type == 'joinedGame'){
		//console.log(msg.content);
		var data = JSON.parse(msg.content); 
		var message = 'Hello, ' + data.name 
	};
	
	if (msg.type == 'turnPlayed'){
		//console.log(msg.content);
		var data = JSON.parse(msg.content); 
		//console.log(data.player);
		var row = data.tile.split('_')[1][0];
		var col = data.tile.split('_')[1][1];
		var opponentType = data.playerType === P1 ? P2 : P1;
		
		game.updateBoard(data.playerType, row, col, data.tile);
		
		alert('NOW IS YOUR TURN');
		
		//console.log(player);
		player.currentTurn = true;
		$('#turn').text('Your turn.');
	};
	
	if (msg.type == 'gameEnded') {
		//console.log(msg.content);
		var data = JSON.parse(msg.content); 
		alert(data.message);
		
	}
};
  
$(document).ready(function() {
	$("#status").text("Not connected!");
	$("#logged").hide();
	socket = new WebSocket("ws://localhost:8080", "tic_tac_toe");
	socket.addEventListener("open", function (evt){
		$("#status").text("Connected!");
	});
	socket.addEventListener("error", function(evt){
		$("#status").text("Error!");
	});
	socket.addEventListener("close", function(evt) {
		$("#status").text("Not connected!");
	});
	socket.addEventListener("message", handleServerMessage);

	$('#new').click(function(evt) {
		var name = $('#nameNew').val();
		if (!name) {
			alert('Please enter your name.');
			return;
		}
		var msg = message('newGame', { name });
		sendMsg(msg);
		player = new Player(name, P1);
	});

	$('#join').click(function(evt) {
		var name = $('#nameJoin').val();
		if (!name) {
			alert('Please enter your name');
			return;
		}
		var msg = message('joinGame', { name });
		sendMsg(msg);
		player = new Player(name, P2);
	});
});

/**
 * Player class
 */
var Player = function(name, type){
	this.name = name;
	this.type = type;
	this.currentTurn = true;
	this.movesPlayed = [];
}

Player.prototype.updateMovesPlayed = function(tileValue){
	this.movesPlayed.push(tileValue);
}

Player.prototype.getMovesPlayed = function(){
	return this.movesPlayed;
}

Player.prototype.setCurrentTurn = function(turn){
	this.currentTurn = turn;
	if(turn){
		$('#turn').text('Your turn.');
	} else {
		$('#turn').text('Waiting for Opponent');
	}
}

Player.prototype.getPlayerName = function(){
	return this.name;
}

Player.prototype.getPlayerType = function(){
	return this.type;
}

Player.prototype.getCurrentTurn = function(){
	return this.currentTurn;
}



/**
 * Game class
 */
var Game = function(){
  this.board = [];
  this.moves = 0;
}

Game.prototype.createGameBoard = function(){
  for(var i=0; i<3; i++) {
    this.board.push(['','','']);
    for(var j=0; j<3; j++) {
      $('#button_' + i + '' + j).on('click', function(){
        
		if(player.currentTurn){
			var row = parseInt(this.id.split('_')[1][0]);
			var col = parseInt(this.id.split('_')[1][1]);
			
			//console.log(player.currentTurn);
			
			//Update board after your turn.
			game.playTurn(this);
			game.updateBoard(player.getPlayerType(), row, col, this.id);
			
			
			player.currentTurn = false;
			$('#turn').text('Waiting for Opponent');
			player.updateMovesPlayed(row+''+col);
			game.checkWinner();
        }else{
			alert('Its not your turn!');
		}
	  });
    }
  }
}

Game.prototype.displayBoard = function(message){
	$('.menu').css('display', 'none');
	$('.greeting').css('display', 'block');
	$('.gameBoard').css('display', 'block');
	$('#userHello').html(message);
	this.createGameBoard();
}

Game.prototype.updateBoard = function(type, row, col, tile){
	//console.log('PLAYER TYPE '+type)
	
	$('#'+tile).text(type);
	type === P1 ? $('#'+tile).css('color', 'red') : $('#'+tile).css('color', 'blue');
	$('#'+tile).prop('disabled', true);
	this.board[row][col] = type;
	this.moves ++;
}

Game.prototype.playTurn = function(tile){
	var clickedTile = $(tile).attr('id');
	var turnObj = {
		tile: clickedTile,
		playerType: player.type,
		playerName: player.name
	};

	var msg = message('playTurn', turnObj);
	sendMsg(msg);
  
}

Array.prototype.contains = function(elem){
	for (var i in this){
		if (this[i] == elem) 
			return true;
	}
	return false;
}


Game.prototype.checkWinner = function(){		
	var currentPlayerPositions = player.getMovesPlayed();
	if (currentPlayerPositions.length >2){
		if(
			(currentPlayerPositions.contains('00') && currentPlayerPositions.contains('01') && currentPlayerPositions.contains('02'))||
			(currentPlayerPositions.contains('10') && currentPlayerPositions.contains('11') && currentPlayerPositions.contains('12'))||
			(currentPlayerPositions.contains('20') && currentPlayerPositions.contains('21') && currentPlayerPositions.contains('22'))||
			(currentPlayerPositions.contains('00') && currentPlayerPositions.contains('10') && currentPlayerPositions.contains('20'))||
			(currentPlayerPositions.contains('01') && currentPlayerPositions.contains('11') && currentPlayerPositions.contains('21'))||
			(currentPlayerPositions.contains('02') && currentPlayerPositions.contains('12') && currentPlayerPositions.contains('22'))||
			(currentPlayerPositions.contains('00') && currentPlayerPositions.contains('11') && currentPlayerPositions.contains('22'))||
			(currentPlayerPositions.contains('20') && currentPlayerPositions.contains('11') && currentPlayerPositions.contains('02'))
		)	
			{

				var msgToSend = player.getPlayerName() + ' wins!';
				game.announceWinner(msgToSend);

			}
	}
	
	var tied = this.checkTie();
	if(tied){
		var message = 'Game Tied';
		game.announceWinner(message);	
	}
}


Game.prototype.checkTie = function(){
	return this.moves >= 9;
}

Game.prototype.announceWinner = function(msgToSend){
	var msg = message('endGame', {msgToSend});
	sendMsg(msg);
}




  