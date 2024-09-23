class connectedClient:
	'''Class for clients who connect to the server.
Takes an id string and a name string as parameters on construction'''
	def __init__(self, ide: str, nam: str) -> None:
		self.ident = ide
		self.name = name
		self.blocklist = list
	@classmethod
	def addClientToBlockList(self, block: any)  -> bool:
		'''Adds a client to the blocklist of this client.
Returns True upon succeeding, false upon failing.'''
		if isinstance(block, connectedClient):
			self.blocklist.append(block)
			return True
		else:
			return False
	@classmethod	
	def removeClientFromBlockList(self, block: any) -> bool:
		'''Removes a client from the blocklist of this client.
Returns True upon succeeding, false upon failing.'''
		if isinstance(block, connectedClient):
			if self.blocklist.count(block) > 0:
				self.blocklist.remove(block)
				return True
			else:
				return False
		else:
			return False
	@classmethod
	def isInBlockList(self, block: any) -> bool:
		'''Verifies if the client passed as a parameter is in the Blocklist.
Returns True upon finding the client, false if the client is not in the list 
OR if the paramater passed is not a connectedClient object'''
		if isinstance(block, connectedClient):
			if self.blocklist.count(block) > 0:
				return True
			else:
				return False
		else:
			return False
	