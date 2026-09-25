# Cover Page

![Frontline DNS Logo](FrontlineDNSLogo.png)
Team Members: Cole Amacker, Tim Heiser, Veronica Rine, 
James Yoho, Isaiah Zimmerman

September 24<sup>th</sup>, 2026

## Introduction

### Purpose of the System

The military controls numerous devices connected to closed networks. Since they are on closed networks, users use outdated methods to map IPs to device names and track IP address ranges on applications not designed for DNS, such as Microsoft Excel. The purpose of this system is to upgrade their network management tools through a gradual migration.

### Target Users

The target users are TurbineOne employees who are setting up IT systems in various locations and military personnel who are collaborating with the TurbineOne employees.

### Main Features

The main features are DNS functionality, an admin dashboard, and device health check capabilities. The DNS functionality will allow users to track IPv4s, IPv6s, and domain names through a dedicated application, and allow for importing and exporting to and from Excel to ease the software migration. The admin dashboard enables management of importing and exporting from Excel, user management, and review and editing of device adding requests submitted by users. The device health check capabilities let admins track network status and review logs of previously documented issues.

## Representative Tasks

## Related Work

### Product 1 - SolarWinds
SolarWinds [1] is an IP address manager that provides much of the same functionality we are looking to build in our own product. SolarWinds is designed as a modern alternative to keeping IP and DNS information in spreadsheets that can became difficult to manage at larger scales. They provide a user interface that allows network administrators to look at available IP adresses and monitor the status and useage of active addresses. Additionally, SolarWinds actively scans networks in order to perform health checks and record various pieces of metadata about network devices. 

Although the features listed above are very similar to the features we plan on building into our product, the foundational aspect of our product is a DNS server, whereas SolarWinds is an IP address manager. Because of this, SolarWinds offers a wider range of features than TurbineOne needs, and the extensive software suite comes with a high price tag which is overkill for our specific use case. Additionally, since TurbineOne works with DoD customers, there are more stringent requirements for software, and a smaller locally-hosted piece of software will offer more flexibility.

### Product 2 - InfobloxDDI
Infoblox [2] aligns almost exactly with our product's goal, but it once again has a wider scope and more robust set of features than TurbineOne needs. Inboblox's service includes the management of DNS, DHCP, and IP address management. They put an exphasis on their ability to manage networks that are transitioning from IPv4 to IPv6, which is one of the goals of our product as well.

Although the software Infoblocks creates has largely the same purpose as the product we want to build, the... . TurbineOne is a quickly growing company that works with a variety of military customers, and their product need is for a piece of software that can be quickly deployed in a variety of locations (we will aim to do this by having our product deployabkle through a docker container). Infoblox is an industry leader in network management, but their product is bulky and expensive. Our goal is to create a product that is streamlines to a narrower set of needs and easily deployable in an offline setting. 

### Product 3 - Auvik 
Auvik [3] is a network monitoring platform that focuses on the live state of the network instead of managing IP addresses and DNS servers. Our product will be considerably different from Auvik because we are primarily interested in providing TurbineOne with an easily managed DNS server and network monitoring information. However, Auvik does put a significant focus on network topology maps that allow users to see the network layout, network links, and the paths that network traffic is flowing through. This feature is not included in our MVP, but it is something that we hope to implement in some form after finishing other basic aspects of our product. Because different devices in TurbineOne's networks will be mobile, we hope that our product will include a tool to visualize how the network links asjust as devices move around. 

### Product 4 - CoreDNS
CoreDNS is a lightweight Go based DNS server. The software is modularized into plugins, so users can choose different plugins based on individual use cases, which keeps CPU usage low. CoreDNS is open source and containerized, so it can be easily deployed with minimal set up time. Our product will strive to be similar to coreDNS, but with a few added features such as an administrative dashbaord and network monitoring. The architecture of our product is especially similar to CoreDNS, becasue our software will be written in Go and deployable in a Docker container. 

## Bibliography
[1] SolarWinds - https://www.solarwinds.com/ip-address-manager/  
[2] Infoblox - https://www.infoblox.com/solutions/  
[3] Auvik - https://www.auvik.com/network-management-software/network-mapping-software/  
[4] CoreDNS  - https://coredns.io/?utm_source=gemini  