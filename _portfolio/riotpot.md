---
title: "RIoTPot: A Shapeshifting Honeypot"
author_profile: true
toc: true
#sidebar:
#  nav: riotpot

gallery-figma:
  - url: /assets/gsoc-2022/figma-service.jpg
    image_path: /assets/gsoc-2022/figma-service.jpg
    alt: "Service"
    title: "Service"
  - url: /assets/gsoc-2022/figma-services.jpg
    image_path: /assets/gsoc-2022/figma-services.jpg
    alt: "Services"
    title: "Services"
  - url: /assets/gsoc-2022/figma-profile.jpg
    image_path: /assets/gsoc-2022/figma-profile.jpg
    alt: "Profile"
    title: "Profile"
  - url: /assets/gsoc-2022/figma-profiles.jpg
    image_path: /assets/gsoc-2022/figma-profiles.jpg
    alt: "Profiles"
    title: "Profiles"
  - url: /assets/gsoc-2022/figma-instance.jpg
    image_path: /assets/gsoc-2022/figma-instance.jpg
    alt: "Instance"
    title: "Instance"
  - url: /assets/gsoc-2022/figma-instances.jpg
    image_path: /assets/gsoc-2022/figma-instances.jpg
    alt: "Instances"
    title: "Instances"

gallery-api:
  - url: /assets/gsoc-2022/riotpot-api-1.png
    image_path: /assets/gsoc-2022/riotpot-api-1.png
    alt: "API Schemas"
    title: "API Schemas"
  - url: /assets/gsoc-2022/riotpot-api-2.png
    image_path: /assets/gsoc-2022/riotpot-api-2.png
    alt: "API Proxy Endpoints"
    title: "API Proxy Endpoints"
  - url: /assets/gsoc-2022/riotpot-api-3.png
    image_path: /assets/gsoc-2022/riotpot-api-3.png
    alt: "API Proxy Expoint New Proxy With Service"
    title: "API Proxy Expoint New Proxy With Service"
---

# 1. Project Description

## 1.1 Organisation

- Name: The Honeynet Project
- LinkedIn: https://www.linkedin.com/company/the-honeynet-project/
- Site: https://www.honeynet.org/
- Slack: honeynetpublic.slack.com

## 1.2 Mentors

Thanks to my mentors!

- [Emmanouil Vasilomanolakis](https://www.linkedin.com/in/emmanouil-vasilomanolakis-202a2355)
- [Shreyas Srinivasa](https://www.linkedin.com/in/shreyas-srinivasa-47038b13)

# 1.3 Links

- GitHub Repository: https://github.com/aau-network-security/riotpot
  - Branch: [gsoc_2022](https://github.com/aau-network-security/riotpot/tree/gsoc_2022)
  - Profiles used:
    - RicYaben
    - ryaben
    - ryabenbc
- Figma (mock):

# 2. Report

## 2.1 Requirements

The main objective for GSoC 2022 was to initiatte a transformation to make RIoTPot a honeypot framework, and improve the usability of the overall system.
In addition, the system was to be suplemented with profiling capabilities (e.g. to mimic realistic devices through templates or create a customised experience).
We agreed on the following _"epic"_ features as the definition of **"done"**.

### 2.1.1 Profiles

### 2.1.2 Proxy ([#63](https://github.com/aau-network-security/riotpot/issues/63))

As a framework, RIoTPot distances itself from handling the individual services and/or honeypots available in the system.
The role of RIoTPot should be to provide an interface for attackers to communicate with these services, and focus on managing the availability of the services by exposing or hiding services on demand.

This change gives the ability to combine RIoTPoT with any other service (e.g. to use another dedicated honeypot as an endpoint).
As the name indicates, this feature transforms RIoTPoT into a proxy manager to route the communication between attackers and services.

### 2.1.3 API ([#58](https://github.com/aau-network-security/riotpot/issues/58))

The system requires a standard method to modify the state of the application.
Exposing API endpoints facilitates other applications to interact directly with the system through common methods.

### 2.1.4 UI ([#57](https://github.com/aau-network-security/riotpot/issues/57))

Creating a UI interface that communicates with the API will enhance the user experience, and welcome new methods to interact with the data.

## 2.2 Design

The system has been redesigned to allow for the intended changes.
Since riotpot will no longer manage containers on its own, we decided to remove the need for virtualisation entirely, and scoping the capabilities of the system to simply expose proxy endpoints and an API.

Figure 1 shows this architecture design in practice.
Services remain hidden and active in the host and connected to the same network as RIoTPot; however, these services are not accessible through the internet.
This will give us flexibility to manage connections in the future, perhaps upgrading or downgrading connections.
The `webapp` uses the API to modify riotpot and consume information,
Finally, [TCPDump](https://www.tcpdump.org/) observes the communications between riotpot and attackers, and stores the traces into`.pcap` files, which rotate when they reach a certain size.

{% include figure image_path="/assets/gsoc-2022/riotpot_design.svg" alt="RIoTPot design" caption="**Figure 1**: RIoTPot design" %}

Separated the duties of riotpot and the rest of the components reduces the number of components necessary to run the system, while retaining previous core capabilities.
By doing so, we streamline future improvements to focus on either proxies and middlewares, or the API and the UI.

Regarding the UI, we mocked the application using [Figma](https://www.figma.com/file/mn3xks6crCMEfa7qMPOckx/Riotpot?node-id=0%3A1) to set the basis of the application and the way users would interact with it.
Mocking the application set expectations in terms of the scope of the project and the functionalities that should be included.

<iframe style="border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 6px;" width="800" height="450" src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2Fmn3xks6crCMEfa7qMPOckx%2FRiotpot%3Fnode-id%3D0%253A1" allowfullscreen></iframe>

While a mocking only represents the initial draft of our prototype, it is beneficial to align on core elements and other components that need prioritisation.
For example, insights on the current state of the individual services and other telemetry was a nice addition to the mock to understand the end-value of the software; however, including pre-set profiles was a higher priority for this project.
Our aim was to create a consistent and simple theme with basic features.
The following gallery contains images of the six core functions of the UI.

{% include gallery id="gallery-figma" caption="Figma mocks" %}

## 2.3 Implementation

Due to the breaking changes introduced in our design, the first point of action was to map the application processes, and identify elements that we could utilise.
We spent a great deal of resources to refactor and document the code in place, and pacing our next steps.
During the first half of the project we dedicated our efforts to the internal implementation of the honeypot.
We discuss this process in more detail in [Section 2.3.1](#231-shaping-the-honeypot2.3.1-shaping-the-honeypot).
The second part of the project focused on the implementation of the UI, as described in [Section 2.3.2](#232-ui).

### 2.3.1 Shaping The Honeypot

From the core, we only maintained the plugin honeypot services that provide low interaction emulation, the rest was either set for refactoring or removed altogether.
Furthermore, we identified three streams for enhancement: **Services, Proxies and the new API**.
Finally, we settle on the **observer** and **factory** patterns to manage the state of the services and proxies globaly, while using a **REST API** to communicate with the UI.

**A.** First, we included a standard library to standarise the logging output.
Due to the requirements of honeypots in terms of bandwidth and resources, we decided to use a logger with zero memory allocation. Our choice was [zerolog](https://github.com/rs/zerolog), an open source logger for JSON output.

**B.** Then, we developed a similar manager or "factory" for both `services` and `proxies` that provides an interface to perform insert, deletion and filtering.
In addition, we choose to link services to proxies as a one-to-one relationship.
However, we decided to limit the awareness of this relationship to the proxy, instead of creating a relational manager.
Although this was a decission to maintain simplicity, we acknowledge that there are better ways to track this relationship.

Looking now into the **Proxy** properties, we identified three main functionalities that any proxy must have:

1. **To start and stop the proxy on-demand.**
   This feature checks the availability of the port in the host, and starts listening for connections in the given port. Once the proxy is stopped, the socket is freed and the host closes the port.

```golang
// Function to stop the proxy from runing
func (pe *AbstractProxy) Stop() (err error) {
    // Stop the proxy if it is still alive
    if pe.GetStatus() == globals.RunningStatus {
        // Close the channel
        close(pe.stop)
        // Close the listener
        pe.listener.Close()
        //Wit for the connections and the server to stop
        pe.wg.Wait()
        return
    }
    err = fmt.Errorf("proxy not running")
    return
}
```

2. **To include middlewares that interact with the transiting connections from attacker to service.**
   Proxy middlewares were created to intercept connections from attackers to the honeypot, and take further actions such as dropping the connection, upgrading or fingerprinting the attacker.
   For reference, the connection becomes `attacker -> proxy -> middleware -> service`
   The implementation has been limited to create the structure necessary for developing these middlewares, but no middleware was introduced during the project.

```golang
go func() {
    // Apply the middlewares to the client connection
    tcpProxy.middlewares.Apply(client)
    // Handle the connection between the client and the server
    // NOTE: The handlers will defer the connections
    tcpProxy.handle(client, server)
    // Finish the task
    tcpProxy.wg.Done()
}()
```

3. **To handle both TCP and UDP connections.**
   Due to the variety of protocols available in common devices, the honeypot must handle both TCP and UDP connections. UDP connections in specific is a challenging topic, and complex to implement using Golang.
   We implemented a ratehr basic UDP proxy with room for improvement.
   However, middlewares were not implemented for UDP.

```golang
// Create a new instance of the proxy
func NewProxyEndpoint(port int, network globals.Network) (pe Proxy, err error) {
    switch network {
    case globals.TCP:
      pe, err = NewTCPProxy(port)
    case globals.UDP:
      pe, err = NewUDPProxy(port)
    }
    return
}
```

Moving now to the properties of the **Services**, we needed to differentiate between `plugins` and the rest of the services.
The main difference is that `plugin` services are placed internally (localhost) in riotpot.
Therefore, they need to be started, and must not be removed at any time from the register!

Since this feature could be beneficial for other setups, services can be _locked_ to avoid unintentional deletions.
Deleting a service means that the service is stopped and removed from the list of tracked services in riotpot.
However, **riotpot can not delete services from the system.**

**Info:** By default, riotpot loads all the plugins included in the project and start them even before the API is started. The list can be modified using a configuration file which contains the list of services that must be started.
{: .notice--info}

**Note:** Plugin services are **locked** by default (i.e., can not be deleted), and this can not be changed
{: .notice--danger}

**C.** With a backend structure in place that we could modify, we turned to define API endpoints and routing structure.
For this we used [gin](https://github.com/gin-gonic/gin), an open source HTTP framework that simplifies serialization and routing in golang.
This too implements a zero allocation router that includes nested routing and supports [Swagger](https://swagger.io/) documentation.
Swagger is an open source specification for documenting API endpoints.

The API implementation is relatively simple, containing just enough endpoints for performing individual CRUD operations on both services and proxies, and a reduced number of additional endpoints to simplify creating and deleting services already linked to proxies.

```golang
func newServiceAndProxy(ctx *gin.Context) {
    // Validate the post request to create a proxy with a service
    var input CreateService
    if err := ctx.ShouldBindJSON(&input); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    nt, err := globals.ParseNetwork(input.Network)
    if err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    ...

    sv, err := services.Services.CreateService(input.Name,input.Port, ...)
    if err != nil {
      ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
      return
    }

    // Create a new proxy using the parameters from the service
    pe, err := proxy.Proxies.CreateProxy(nt, input.Port)
    if err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    ...

    pe.SetService(sv)
    ret := &ServiceProxy{...}
    ctx.JSON(http.StatusOK, ret)
}
```

{% include gallery id="gallery-api" caption="RIoTPot API from Swagger" %}

### 2.3.2 UI

Regarding the UI, we agreed on using [React](https://reactjs.org/) with [Typescript](https://www.typescriptlang.org/), [SCSS](https://sass-lang.com/) and [Recoil](https://recoiljs.org/)

## 2.4 Summary

### 2.4.1 Commits

The [Commits List](https://github.com/aau-network-security/riotpot/commits/gsoc_2022) spans from commit [edbe15a8e2fca3fe6c3252646d7540e02173f493](https://github.com/aau-network-security/riotpot/commit/bbca3740210c26cb678ad50363232466b66cefaa) to [7f04b2fbaa669fcbcf0119dff1b1a35544b3a432](https://github.com/aau-network-security/riotpot/commit/7f04b2fbaa669fcbcf0119dff1b1a35544b3a432).

### 2.4.2 Contributions

- [x] Proxy
  - [x] TCP
  - [ ] UDP
  - [x] Middlewares
- [x] API
  - [x] CRUD Operations for proxies
  - [x] CRUD Operations for services
  - [x] Swagger API documentation
- [x] UI
  - [x] Instances
  - [x] Services
  - [x] Profiles
  - [ ] Settings
- Protocols
  - OCPP
    - [x] High Interaction
    - [ ] Low Interaction (v1.6)
- Other
  - Included standard formatter
  - Removed Docker dependancy
  - Refactor code

### 2.4.3 Known Issues

- SSH internal low interaction protocol crashes the application when a client closes the connection
- UDP Proxy and Middlewares need to be revised

## 2.5 Example Execution

## 2.6 Next Steps

### 2.6.1 RIoTPoT

### 2.6.2 UI

# 3 The GSoC 2022 Experience

## 3.1 First half (June 12th - August 1st)

## 3.2 Second Half (August 1st - September 12th)
