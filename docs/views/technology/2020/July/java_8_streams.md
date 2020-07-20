---
title: Java 8 Streams and Lambda
author: Samrat Saha
date: 2020-07-20
tags:
 - intermediate
 - java
 - java 8
 - features
 - functional interfaces
 - streams
 - lambdas
categories:
 - technology
---

## The Change you need: Streams and Lambda
After learning about streams and lambda in Java 8, my style of writing code underwent a fundamental change. It reduced bugs in my code, enabled me to think more in terms of functional programming and best of all it reduced the number of lines I had to write for a functionality and made the code even more readable! 

However, if you are not familar with streams and lambda then it will this concept will seem very alien and you will stay away from it for the **REST OF YOUR LIFE!**

 So I hope after reading this post you will be able to avoid that fate :).
<!-- more -->

<img src="/lambda.jpg"/>
<sub>Where my Half-Life people at?</sub>

## What are Streams?
In Java 8, Streams were introduced and they basically allow us to use write code in a more functional way. Streams are **LAZY**, meaning unless some terminal operation is done on them, they will not execute and return a result.

How do you get a stream? The collections api has been enhanced to include the **`.stream()`** method which returns a stream. Lets look at a example
``` java
public class Main{
    public static void main(String[] args){
        //Imagine you getting this list from somewhere
        List<Integer> numList = new ArrayList<>();
        numList.add(1);
        numList.add(2);
        numList.add(3);
        numList.add(4);
        numList.add(5);
        numList.add(6);

        //now we can call .stream() to get a stream
        Stream<Integer> numStream = numList.stream();
    }
}
```

Above is how you will usually use it, you already have some collection and want to use stream programming. We can also directly initialize a stream.

``` java
//We can use the static method 'of(T t1, T t2....)' 
//present on the Stream interface.
//Useful for generating stream from a finite or small number of elements.
Stream<Integer> finiteNumStream = Stream.of(1,2,3,4,5,6);

//We can use `.iterate()` to get a infinite stream
//1st argument is the initial element.
//2nd argument is a special variation of Function Interface
//with input and output of same type which is 
//called UnaryOperator Interface.
Stream<Integer> infiniteNumStream = Stream.iterate(0, num -> num + 1);

Stream<Integer> anotherInfiniteStream = Stream.generate(new Random()::nextInt);

//if we print the infinite streams , it will never end... 
//and it might not really be useful, so there ways to limit
//the stream 
infiniteNumStream.limit(10); //take the 10 elements then stop

```

There are also classes to Initialise streams for specific Types. They include IntStream, LongStream, DoubleStream. They include static methods what we saw above and extra methods for the specific Data Type. You can check them out :)

## What is a Lambda?

If you have seen streams code before and you get confused then I guess it must be because of the mysterious arrows that people keep throwing around in the code. Those are lambdas.

I remember pulling my hair out because I couldnt understand the purpose or their syntax.

::: tip Lambda Definition
A lambda is a anonymous function, it does not need a function name, input type and return type because it can be inferred.
:::

There are some simple rules for defining a lambda.

``` java
//If your function has one input
a -> 

//If your function has more than one input
(a, b, c, d, e ) ->

//If your function needs no input then we need empty round brackets.
() ->

//The arrow indicates the end of input arguments and start of logic.
```
Above are rules for input.

``` java
//If your logic is of one line
a -> a + 1

//If your logic is of one line and you need to return result
//boolean in this case.
a -> a == 1

//If your logic is of multiple lines 
//then surround it with curly braces
//notice the use of semi colons here.
a -> { 
        int next = a+1;
    } 

//If your logic is of multiple lines 
//and you need to give back result, use return.
a -> { 
    boolean result = false;
    if(a > 1 && a <10>) result = true;
    else result = false;
    return result;
    } 

```

Above were rules for the body and returning results.

::: danger Something's Strange..
But wait how do we find the type of input arguments and the type of output arguments or the function even returns any output?
:::

If you asked the above question then nice!! Well that can be inferred by the Functional Interface.

Look at these examples to understand better.
``` java
//from the generics, it can infer `a` is of type Integer,
//nothing is returned.
Consumer<Integer> consInt = a -> a + 1;

//from the generics it can infer `a` is of type Integer
//and return type is also of type Integer
Function<Integer, Integer> funcInt = a -> a + 1;

//The above effect can be achieved in a similar way in method declarations.
public void methodCons(Consumer<Integer> consumer) {.....}

public void methodFunc(Function<Integer, Integer> function) {.....}

//then when using these methods we can directly pass
methodCons(a -> a + 1);
methodFunc(a -> a + 1);
```
::: warning Note
I would advise you to read the post on [Functional Interfaces](./java_8_features.html#function-interface) first if you find mentions of Functional Interfaces alien.
Also look at [this](./java_8_features.html#way-1) to appreciate lambdas a bit more.
:::

::: warning Note
Did you see above, how the **same** lambda expression can mean differently according to context?
:::

Thats all basically it for lambdas, there is also an alternative way to use Functional Interfaces that is called **Method References**.

## Stream Operations And Lambdas
Earlier I said streams allow us to write code in functional way but I didnt say how, let's take a look at some examples. I also ofcourse use lambdas along the way.
 We will first solve them the traditional way and then Java 8 way.

### Problem 1

Find strings in a list which start with 'tr' and end with 'ed', we need a max of 5 such strings. After finding, take the size of each string then return the sum of sizes.

``` java
//Traditional Way
    static String START = "tr";
    static String END = "ed";

    public long getSum(List<String> list){
        int counter = 0;
        long sum = 0L; 
        for(int i = 0; i< list.size() ;i++){
            if(list.get(i).startsWith(START) && list.get(i).endsWith(END)){
                sum += list.get(i).length();
                count++;
            }

            if(count == 5)
                break;
        }
        return sum;
    }
```
A traditional approach would more or less look like above. It has a variable for maintaining `count`, `sum`. Iterate the loop, check for condition, if true add the size to sum, check if we got 5 elements then break and at the end return `sum`

``` java
//Java 8 Way
    static String START = "tr";
    static String END = "ed";

    //filter by our custom condition, take only 5 elem at max,
    // get size of string and then return sum of all sizes.
    public long getSum(List<String> list){
        return list.stream().filter(s-> s.startsWith(START) && s.endsWith(END)).limit(5).
                mapToLong(s-> s.length()).sum();
    }
```

The above solution looks great! It is much simpler to understand and is compact.

Here `filter` is a operation/method on Stream, that accepts a predicate. If you have read the post on [Functional Interfaces](./java_8_features.html#predicate-interface) you will remember that `Predicate` Interface, takes some input, does some logic and return boolean. Our logic here is for string matching at start and end.

We looked at the `limit()` earlier, it limits the number of elements to next stage.

Now lets take a look at `map` because in your life you would be using it many times. There are many methods which start with keyword `map` on streams, they all basically transform a value. Here we are transforming from `String` to length of string (`Integer`). If you look closely at `map` methods you will find they all accept some kind of `Function` Interface. 

::: tip Remember
Streams are lazy in nature, therefore use of `sum` method is very important here, because use of this method signifies the start of processing as it's a terminal operation.
:::
### Problem 2
You are given a list of list of strings. You have to peform check on the nested list to see if is at least 5 in size. Trim all strings, if they are any of reserved keywords remove them and return only unique strings.

``` java
//Traditional Way

public Set<String> getUniqueStrings(List<List<String>> allLists, Set<String> reservedKeywords){
    Set<String> result = new HashSet<>();
    
    for(List<String> nestedList : allLists){
        if(nestedList.size() > 4){
            
            for(String str : nestedList){
                String trimmed = str.trim();
                if(!reservedKeywords.contains(trimmed))
                    result.add(str.trim());    
            }
        }
    }
    return result;
}
```
The traditional way actually doesnt look that bad, does it? Lemme know :)

Lets move onto java 8 way.
``` java
//Java 8 Way

public Set<String> getUniqueStrings(List<List<String>> allLists, Set<String> reservedKeywords){
    return allLists.stream().filter(list -> list.size() > 4).
            flatMap( list -> list.stream()).
                map(str -> str.trim()).filter(str -> !reservedKeywords.contains(str)).
                    collect(Collectors.toSet());
}
```

The above stream operations/methods should look similar, the new operations here are `flatMap` and `collect`.

Operations `map` and `flatMap` are very similar except that the `flatMap` operation signifies that the logic inside lambda itself returns stream, so all flatMap does it _flattens_ all such returned streams. Flatten here means that it joins all such streams and returns a single stream. We have to do this because our further operations operate on a individual string and not on individual list.

``` java
//Function Signature in map
Function<A, B>
    //vs
//Function Signature in flatMap
Function<A, Stream<B>>
```

The operation `collect` allows us to convert our streams into Collections. Why couldnt we just return Stream? Remember streams are lazy and unless we do some terminal operation (`collect` is terminal), no processing has actually occured. So returning a Stream would mean doing no processing (_although it's upto you to decide what you want out of your methods, here we want a `Collection`_).

The `collect` operation is aptly named as it allows us to _collect_ our stream into a collection, therefore it's also a terminal operation. The `collect` operation accepts a `Collector` and the `Collectors` utility class provides us a lot of ready made Collectors. We could have used `Collectors.toList()`, if the problem said we didnt need to worry about uniqueness. The Collectors class is very powerful and contains a lot of methods, do check it out!

### Problem 3

You are given a list of strings, group the strings by the size and return a `Map<Integer, List<String>>` where key is size and list are the grouped strings.

The traditional way is pretty straight forward.
``` java
//Tradtitional Way

public void Map<Integer, List<String>> groupBySize(List<String> list){
    Map<Integer, List<String>> result = new HashMap<>();

    for(String str: list){
        if(result.contains(result.length())){
            result.get(result).add(result);
        } else {
            List<String> newList = new ArrayList<>();
            newList.add(str);
            result.put(str);
            }
    }

    return result;
}
```

Now for the Java 8 way! Behold!
``` java
//Java 8 Way

    public Map<Integer, List<String>> groupBySize(List<String> list) {
        return list.stream().
            collect(Collectors.
                groupingBy(
                    str -> str.length(), 
                    () -> new HashMap<>(), 
                    Collectors.mapping(str -> str, Collectors.toList()
                    );
    }
```

It is times like this where I am afraid to say that Java 8 way is better or the code is more readable or simpler... However if you read the Api docs after a while this does become true.

So lets remember what we want to do, we just want to group our strings by size.

So for that purpose we are using the Collectors.groupingBy api,
when using the api we need some way to say to api, that given a string here is how you get a key. This is done on line 7.

Now at line 8, we have the freedom to provide the implementation of our `Map` that we want to return. There are `HashMap, TreeMap, LinkedHashMap` etc, options available to us, we have used `HashMap`. 

Finally at line 9, we get to say to the api, that we want to group the values by using a `List`. Here also we could have used another collection like `Set` or even another `Map`.

## Conclusion
So that's it for Streams and Lambdas! There plenty more things you can do, so read the api docs!

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



