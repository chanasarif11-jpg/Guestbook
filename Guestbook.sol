
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BlockchainGuestbook {

    struct Message {
        string visitorName;
        string message;
        address sender;
        uint256 timestamp;
    }

    Message[] private messages;

    function addMessage(
        string memory _visitorName,
        string memory _message
    ) public {
        require(bytes(_visitorName).length > 0, "Name is required");
        require(bytes(_message).length > 0, "Message is required");
        require(bytes(_message).length <= 200, "Message exceeds 200 characters");

        messages.push(
            Message({
                visitorName: _visitorName,
                message: _message,
                sender: msg.sender,
                timestamp: block.timestamp
            })
        );
    }

    function getMessage(uint256 _index)
        public
        view
        returns (
            string memory,
            string memory,
            address,
            uint256
        )
    {
        require(_index < messages.length, "Invalid message index");

        Message memory item = messages[_index];

        return (
            item.visitorName,
            item.message,
            item.sender,
            item.timestamp
        );
    }

    function getTotalMessages() public view returns (uint256) {
        return messages.length;
    }
}
