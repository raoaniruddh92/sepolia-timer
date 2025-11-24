// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract timer{
    uint public time;

    constructor(){
        time=block.timestamp;
    }
}