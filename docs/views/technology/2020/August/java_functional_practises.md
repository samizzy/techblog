---
title: How to modularize your Java 8 code
author: Samrat Saha
date: 2020-08-15
tags:
 - intermediate
 - java
 - java 8
 - functional interfaces
 - lambdas
categories:
 - technology
publish: true
---

We have learned about [Lambdas](../July/java_8_streams.html#what-is-a-lambda) and [Functional Interfaces](../July/java_8_features.html#function-interface) before. Now that we have got the concepts clear, we will see how we can modularize our code using them.

<!-- more -->

## Using Functions inside of Methods
You will always come across methods that are just _toooo_ long. It makes understanding the code really difficult and wakes up the criminal inside you and you just hope that you dont know the person who wrote it otherwise there _will_ be carnage.

Imagine you have a problem, you are given a user name and you have to find other details of the user. You have to check the cache first and then the database to avoid latency. Also some details of the user have to be taken from different services. Ofcourse you also have to do some validation, ie does the userName exist, length of the userName, userName is not empty etc.

Looking at some code will give you a better idea. Getting the User and UserWithDetails class out of the way first.
``` java
    class User{
        public final String userName;
        public final String name;
        public final int age;

        public User(Stirng userName, String name, int age){
            this.userName = userName;
            this.name = name;
            this.age = age;
        }
    }

    class UserWithDetails{
        public final User user;
        public final byte[] thumbnail;
        public final boolean online;
        public final long lastSeen;

        public UserWithDetails(User user, byte[] thumbnail, boolean online, long lastSeen){
            // imagine all the associations here..
        }
    }
```
### Long Code example
``` java
    //Lets Assume the Cache, Database, Detail Service and all the exceptions classes exist
    private Cache cache1 = initCache1();
    private Cache cache2 = initCache2();
    private Database db  = initDb();
    private DetailService detailService = getDetailService();

    public User getUser(String userName){
        //Do validation, if fail throw exception
        if(userName.trim().isEmpty())
            throw new EmptyUserName();        

        if(userName.length > 255)
            throw new InvalidUserName(userName);

        //Check cache1 and cache2
        UserWithDetails userDetails = cache1.getUserDetails(userName);
        if(userDetails == null)
            userDetails = cache2.getUserDetails(userName);

        //If user found from cache then return, otherwise search in db
        User user = null;
        if(userDetails != null) 
            return userDetails;
        else user = db.getUser(userName)

        //If still not found throw Exception
        if(user == null)
            throw new UserDoesNotExist(userName);
        
        //if user exist then get user with details
        userDetails = detailService.getUserDetails(user);
        
        //store in cache
        cache1.store(userDetails);
        cache2.store(userDetails);

        //Now we are ready to return
        return userDetails;
    }    
```
To be honest the example above is not really long or complex to read but this method sums up the problem nicely that we are trying to solve.

**Problems:**
- Numeruous validation of userName. You have to carefully read each line to know when it starts and when it ends. Here we have only 2 but usually we would have many such validations and then it gets harder to read.
- No code _reuse_. The part of getting userDetails from cache1 and cache2 is repeated.
- The code is full of dealing with null values.
- We are doing several different things inside the method, and many of those thing could be isolated which would increase the cohesiveness.

### Code with private functions example

``` java
    private Cache cache1 = initCache1();
    private Cache cache2 = initCache2();
    private Database db  = initDb();
    private DetailService detailService = getDetailService();

    private List<Cache> cacheList = Stream.of(cache1, cache2).to(Collectors.toList());

    public User getUser(String userName){
        //Do validation, if fail throw exception
        Function<String, Optional<Exception>> validateUserName =
                (user) -> {
                    if (user.trim().isEmpty()) return Optional.of(new EmptyUserName());
                    else if (user.length() > 255) return Optional.of(new InvalidUserName(user));
                    return Optional.empty();
                };
        
        throwExIfPresent(validateUserName.apply(userName))

        //Check cache1 and cache2
        Option<UserWithDetails> userFromCache = 
            cacheList.stream().map(cache -> cache.getUserDetails(userName)).
                filter(Objects::nonNull).findFirst();
        
        //If user found from cache then return
        if(userFromCache.isPresent()) return userFromCache.get();

        //otherwise search in Db, if user found then get user details from detailService
        Option<UserWithDetails> userFromService = 
            Stream.of(db.getUser(userName)).filter(Objects::nonNull).
                map(detailService::getUserDetails).findFirst();
        
        //If details found, store in cache
        userFromService.ifPresent(usd -> cacheList.forEach(cache -> cache.store(usd)));
        
        //If details found return otherwise throw exception.
        return userFromService.orElseThrow(() -> new UserDoesNotExist(userName));
    }

    // Wrote this outside as this could be reused in other methods too .. in a real application this would make sense.
    private void throwExIfPresent(Optional<Exception> exOpt){
        if(ex.isPresent()) throw ex.get();
    }
```

We have addressed all the problems I mentioned earlier.

## Using Closures

::: tip Closure Definition
A Function that uses variables outside of it's scope is called a Closure.
:::

Do not worry if you dont understand, it will be clear later. 

First lets look at the problem.

You receive a request to process a order like on an ecommerce website. This order will go through various stages and will take a bit of time. You want your client to
be able to view the progress so you save the details in a database, then your client can query and know the status.

In below examples we are not concerned with the actual processing steps but just the part with saving to a database.

Getting some common code out of the way first.

``` java
    public enum Stage {
        CUSTOMER_CREDIT_CHECKING,
        CUSTOMER_CREDIT_DONE,
        ITEM_QUANTITY_CHECKING,
        ITEM_QUANTITY_DONE,
        ITEM_DELIVERABILITY_CHECKING,
        ITEM_DELIVERABILITY_DONE
    }
```
``` java
    public class OrderState{
        private final Customer customer;
        private final Order order;
        private final Long startTime;
        private final Long lastUpdateTime;
        private final Stage stage;

        //constructor and all..
    }
```
### Traditional Way
We just need to focus on the processRequest method.

``` java
private Datbase db = initDb();
private CreditService creditService = initCS();
private ProductAvailabilityService paService = initPAS();
private ProductDeliverableService pdSerivce = initPDS();

public void processRequest(Request request){
    Order order = request.getOrder();
    Customer customer = request.getCustomer();
    Long startTime = System.currentTimeMillis();

    saveToDb(customer, order, startTime, CUSTOMER_CREDIT_CHECKING);
    //Do logic with creditService
    saveToDb(customer, order, startTime, CUSTOMER_CREDIT_DONE);

    saveToDb(customer, order, startTime, ITEM_QUANTITY_CHECKING);
    //Do logic with paService
    saveToDb(customer, order, startTime, ITEM_QUANTITY_DONE);

    saveToDb(customer, order, startTime, ITEM_DELIVERABILITY_CHECKING);
    //Do logic with pdService
    saveToDb(customer, order, startTime, ITEM_DELIVERABILITY_DONE);
}

private void saveToDb(Customer customer, Order order, Long startTime, Stage stage){
    Long lastUpdateTime = System.currentTimeMillis();
    db.saveOrderState(new OrderState(customer, order, startTime, lastUpdateTime, stage));
}
```

See how inside processRequest, when calling saveToDb we are providing all the arguments to the method each time.

**This can can create problems:**
- Imagine adding a new field, then you would have to change every call of saveToDb
- This method is very small and we have skipped writing the business logic, but ppl can make mistakes when calling the method, usually calling with wrong arguments.
- Though one can say code is reused, when we know we can write closures, then reusability then isnt that high.

### With closures
``` java
private Datbase db = initDb();
private CreditService creditService = initCS();
private ProductAvailabilityService paService = initPAS();
private ProductDeliverableService pdSerivce = initPDS();

public void processRequest(Request request){
    Order order = request.getOrder();
    Customer customer = request.getCustomer();
    Long startTime = System.currentTimeMillis();
    Consumer<Stage> save = 
        stage -> db.saveOrderState(customer, order, startTime, System.currentTimeMillis(), stage) ;
    
    save(CUSTOMER_CREDIT_CHECKING);
    //Do logic with creditService
    save(CUSTOMER_CREDIT_DONE);

    save(ITEM_QUANTITY_CHECKING);
    //Do logic with paService
    save(ITEM_QUANTITY_DONE);

    save(ITEM_DELIVERABILITY_CHECKING);
    //Do logic with pdService
    save(ITEM_DELIVERABILITY_DONE);
}
```
I want to shout TADA! like a magician does after performing a trick! :D 

Its such a small change but look how good the code looks now.

## Conclusion

So that's it, these simple and small changes can make a large difference when writing code. I'll update this post when I find other useful tricks.

Thanks for reading!

***
<template>
  <div>
    <div class='comments'>
      <Disqus shortname='tech-9732viigce' />
    </div>
  </div>
</template>

<script>
import { Disqus } from 'vue-disqus'

export default {
  name: 'PostPage',
  components: {
    Disqus
  }
}
</script>