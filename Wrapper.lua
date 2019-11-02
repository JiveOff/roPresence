--[[

	roActivity Wrapper for roPresence
	Written by JiveOff
	
	This wrapper gives the ability to game devs to set their own players' Discord rich presence.
	
	To start using this wrapper, require this ModuleScript and initialize it with your token.
	Example:
	
		local roActivityClass = require(script.roActivity_Wrapper)
		local roActivity = roActivityClass.new("<your token here>")
		
	You will only be able to run methods from the var that initialized roActivity.
	
	----
	
	Methods:
	
		roActivity:SetUserRichPresence(id, richPresence)
			playerId id: Roblox ID of the player
			richPresenceObject richPresence: Rich Presence object
			
		Sets players' rich presences.
		Returns the result of the request.
		
		richPresenceObject is an object that contains the rich presence properties, you can find all of them here:
			https://discordapp.com/developers/docs/rich-presence/how-to#rich-presence-field-requirements
			
		You can't set any images.
		
		Example code:
		
			result = roActivity:SetUserRichPresence(player.UserId, {
				state = "Waiting..";
			})
			if(result.success == true) then
				print(player.UserId .. "'s presence has been updated.")
			else
				print("Couldn't update " .. player.UserId .. "'s RP status: " .. result.message)
			end
		
		
	
		roActivity:ClearUserRichPresence(id)
			playerId id: Roblox ID of the player
		
		Clears players' rich presences.
		Returns the result of the request.
		
		Example code:
		
			result = roActivity:ClearUserRichPresence(player.UserId)
			if(result.success == true) then
				print(player.UserId .. "'s presence has been cleared.")
			else
				print("Couldn't update " .. player.UserId .. "'s RP status: " .. result.message)
			end
			
		
		
		roActivity:UsingRoActivity(id)
			playerId id: Roblox ID of the player
		
		Returns if a player is using roActivity.
	
		Example code:
			
			result = roActivity:SetUserRichPresence(player.UserId)
			if(result.success == true) then
				if(result.using == false) then
					print(player.UserId .. " is not using roActivity, skipping.")
					return
				end
			else
				print("Couldn't check " .. player.UserId .. "'s status: " .. result.message)
			end
	
	
	Thanks for using roActivity!
	
]]

roActivity = {}
roActivity.__index = roActivity

local HttpService = game:GetService("HttpService")
local Endpoint = "http://presences.jiveoff.fr/game/"

function roActivity.new(t)
    local classSelf = {}
    setmetatable(classSelf, roActivity)

    classSelf.Token = t
    classSelf.Place = game.PlaceId -- Useless to edit as the tokens are bound to your place IDs.

    return classSelf
end

function roActivity:SetUserRichPresence(id, richPresence)
    local dataFields = {
    	["playerId"] = id;
    	["placeId"] = self.Place;
    	["presenceDetails"] = richPresence;
    }
    local finaldata = HttpService:JSONEncode(dataFields)
    local response = HttpService:PostAsync(Endpoint .. "updatePresence", finaldata, Enum.HttpContentType.ApplicationJson, false, { Authorization = "Bearer " .. self.Token})
    return HttpService:JSONDecode(response)
end

function roActivity:ClearUserRichPresence(id)
    local dataFields = {
    	["playerId"] = id;
    	["placeId"] = self.Place;
    }
    local finaldata = HttpService:JSONEncode(dataFields)
    local response = HttpService:PostAsync(Endpoint .. "clearPresence", finaldata, Enum.HttpContentType.ApplicationJson, false, { Authorization = "Bearer " .. self.Token})
    return HttpService:JSONDecode(response)
end

function roActivity:UsingRoActivity(id)
    local dataFields = {
    	["playerId"] = id;
    	["placeId"] = self.Place;
    }
    local finaldata = HttpService:JSONEncode(dataFields)
    local response = HttpService:PostAsync(Endpoint .. "usingPresence", finaldata, Enum.HttpContentType.ApplicationJson, false, { Authorization = "Bearer " .. self.Token})
    return HttpService:JSONDecode(response)
end

return roActivity
