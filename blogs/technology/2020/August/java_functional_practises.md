---
title: How to modularize your Java 8 code
author: Samrat Saha
date: 2020-08-15
tags:
 - beginner
 - java
categories:
 - technology
publish: true
---

We have learned about [Lambdas](../July/java_8_streams.html#what-is-a-lambda) and [Functional Interfaces](../July/java_8_features.html#function-interface) before. Now that we have the concepts clear, let's see how we can modularize our code using them.

<!-- more -->

## Using Functions inside of Methods
You will always come across methods that are just _toooo_ long. It makes understanding the code really difficult and wakes up the criminal inside you — you just hope you don't know the person who wrote it, otherwise there _will_ be carnage.

Imagine you're given a username and you need to look up the user's details. You have to check the cache first, then fall back to the database to avoid latency. Some details also need to be fetched from different services. And of course there's validation — does the username exist, is it too long, is it empty, and so on.

Some code will make this clearer. Let's get the User and UserWithDetails classes out of the way first.

```java
class User {
    public final String userName;
    public final String name;
    public final int age;

    public User(String userName, String name, int age) {
        this.userName = userName;
        this.name = name;
        this.age = age;
    }
}

class UserWithDetails {
    public final User user;
    public final byte[] thumbnail;
    public final boolean online;
    public final long lastSeen;

    public UserWithDetails(User user, byte[] thumbnail, boolean online, long lastSeen) {
        // imagine all the associations here..
    }
}
```

### Long Code example

```java
// Assume Cache, Database, DetailService and all exception classes exist
private Cache cache1 = initCache1();
private Cache cache2 = initCache2();
private Database db = initDb();
private DetailService detailService = getDetailService();

public User getUser(String userName) {
    if (userName.trim().isEmpty())
        throw new EmptyUserName();

    if (userName.length() > 255)
        throw new InvalidUserName(userName);

    UserWithDetails userDetails = cache1.getUserDetails(userName);
    if (userDetails == null)
        userDetails = cache2.getUserDetails(userName);

    User user = null;
    if (userDetails != null)
        return userDetails;
    else
        user = db.getUser(userName);

    if (user == null)
        throw new UserDoesNotExist(userName);

    userDetails = detailService.getUserDetails(user);

    cache1.store(userDetails);
    cache2.store(userDetails);

    return userDetails;
}
```

To be honest, this example isn't really long or complex to read, but it sums up the problem nicely.

**Problems:**
- Multiple username validations are scattered inline. You have to carefully read each line to know where they start and where they end. Here we only have 2, but in practice you'd have many more and it gets harder to follow.
- No code _reuse_. The part that fetches userDetails from cache1 and cache2 is duplicated.
- The code is riddled with null checks.
- We're doing several different things inside one method, and many of those things could be isolated, which would improve cohesion.

### Code with private functions example

```java
private Cache cache1 = initCache1();
private Cache cache2 = initCache2();
private Database db = initDb();
private DetailService detailService = getDetailService();

private List<Cache> cacheList = Stream.of(cache1, cache2).collect(Collectors.toList());

public User getUser(String userName) {
    Function<String, Optional<Exception>> validateUserName =
        (user) -> {
            if (user.trim().isEmpty()) return Optional.of(new EmptyUserName());
            else if (user.length() > 255) return Optional.of(new InvalidUserName(user));
            return Optional.empty();
        };

    throwExIfPresent(validateUserName.apply(userName));

    Optional<UserWithDetails> userFromCache =
        cacheList.stream()
            .map(cache -> cache.getUserDetails(userName))
            .filter(Objects::nonNull)
            .findFirst();

    if (userFromCache.isPresent()) return userFromCache.get();

    Optional<UserWithDetails> userFromService =
        Stream.of(db.getUser(userName))
            .filter(Objects::nonNull)
            .map(detailService::getUserDetails)
            .findFirst();

    userFromService.ifPresent(usd -> cacheList.forEach(cache -> cache.store(usd)));

    return userFromService.orElseThrow(() -> new UserDoesNotExist(userName));
}

private void throwExIfPresent(Optional<Exception> exOpt) {
    exOpt.ifPresent(ex -> { throw ex; });
}
```

We have addressed all the problems I mentioned earlier.

## Using Closures

::: tip Closure Definition
A Function that uses variables outside of it's scope is called a Closure.
:::

Don't worry if you don't fully get it yet — it'll be clear soon.

First, let's look at the problem.

You receive a request to process an order, like on an e-commerce website. The order goes through various stages and takes a bit of time. You want your client to be able to track the progress, so you save the state to a database after each stage — and the client can query it to check the status.

In the examples below, we're not concerned with the actual processing logic, just the part where we save to the database.

Let's get some common code out of the way first.

```java
public enum Stage {
    CUSTOMER_CREDIT_CHECKING,
    CUSTOMER_CREDIT_DONE,
    ITEM_QUANTITY_CHECKING,
    ITEM_QUANTITY_DONE,
    ITEM_DELIVERABILITY_CHECKING,
    ITEM_DELIVERABILITY_DONE
}
```

```java
public class OrderState {
    private final Customer customer;
    private final Order order;
    private final Long startTime;
    private final Long lastUpdateTime;
    private final Stage stage;

    // constructor and all..
}
```

### Traditional Way
We just need to focus on the `processRequest` method.

```java
private Database db = initDb();
private CreditService creditService = initCS();
private ProductAvailabilityService paService = initPAS();
private ProductDeliverableService pdService = initPDS();

public void processRequest(Request request) {
    Order order = request.getOrder();
    Customer customer = request.getCustomer();
    Long startTime = System.currentTimeMillis();

    saveToDb(customer, order, startTime, CUSTOMER_CREDIT_CHECKING);
    // Do logic with creditService
    saveToDb(customer, order, startTime, CUSTOMER_CREDIT_DONE);

    saveToDb(customer, order, startTime, ITEM_QUANTITY_CHECKING);
    // Do logic with paService
    saveToDb(customer, order, startTime, ITEM_QUANTITY_DONE);

    saveToDb(customer, order, startTime, ITEM_DELIVERABILITY_CHECKING);
    // Do logic with pdService
    saveToDb(customer, order, startTime, ITEM_DELIVERABILITY_DONE);
}

private void saveToDb(Customer customer, Order order, Long startTime, Stage stage) {
    Long lastUpdateTime = System.currentTimeMillis();
    db.saveOrderState(new OrderState(customer, order, startTime, lastUpdateTime, stage));
}
```

Notice how inside `processRequest`, we pass all the arguments to `saveToDb` every single time.

**This can create problems:**
- Add a new field and you have to update every `saveToDb` call.
- This example is tiny and skips the actual business logic, but in real code it's easy to call the method with the wrong argument order or miss a parameter.
- Sure, you could argue the code is being reused, but when closures are an option, this feels like leaving something on the table.

### With closures

```java
private Database db = initDb();
private CreditService creditService = initCS();
private ProductAvailabilityService paService = initPAS();
private ProductDeliverableService pdService = initPDS();

public void processRequest(Request request) {
    Order order = request.getOrder();
    Customer customer = request.getCustomer();
    Long startTime = System.currentTimeMillis();
    Consumer<Stage> save =
        stage -> db.saveOrderState(customer, order, startTime, System.currentTimeMillis(), stage);

    save.accept(CUSTOMER_CREDIT_CHECKING);
    // Do logic with creditService
    save.accept(CUSTOMER_CREDIT_DONE);

    save.accept(ITEM_QUANTITY_CHECKING);
    // Do logic with paService
    save.accept(ITEM_QUANTITY_DONE);

    save.accept(ITEM_DELIVERABILITY_CHECKING);
    // Do logic with pdService
    save.accept(ITEM_DELIVERABILITY_DONE);
}
```

I want to shout TADA! like a magician after pulling off a trick! :D

It's such a small change, but look how clean the code is now.

## Conclusion

That's it — these simple, small changes can make a big difference when writing code. I'll update this post as I find more useful tricks.

Thanks for reading!
