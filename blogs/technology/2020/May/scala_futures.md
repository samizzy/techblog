---
title: Taking a look at Scala futures
author: Samrat Saha
date: 2020-05-17
tags:
 - beginner
 - scala
 - futures
categories:
 - technology
---
## Towards the Future
What are futures? Is this a concept only limited to select few from scala? Will it affect your future? We are going to find out about all this and more. Keep reading.
<!-- more -->

<img src="/augmented-reality-education-futre.jpg"/>

[[toc]]

## So what are Futures?
It is a _model_ of parallel programming, there are other models such actor model. It is not limited to scala, there are similar apis in java, javascript and other languages as well.

An informal definition would be: Future is like a lazy person(me). If you give it some task to do, it doesnt do it immediately instead it tells you, _"Yeah I am busy rite now.. will do it later but here is a **gift** you can use instead"_. This **gift** is very _evil_ as it is another future but this one contains our result. The catch is, if you try to open it, there is no guarantee you will find anything inside.

So instead of opening it, you work with the **gift** itself. You might ask, how can I work with the **gift** itself? At some point I will need to open the **gift** rite? (You can)

We will do exactly those things, so keep reading :)
## Need for Futures
_Parallel programming_? People have been parallel programming before right? Java people will say they have java.lang.Thread, why would they bother about futures?

The answer is that Futures are a __wrapper__ over threads, they are a higher level programming api. They provide us many convenient abilities which helps the developer to focus on their programming logic instead of thread creation and their _interaction_. We will see the advantages ahead.

::: warning Note
Using futures freely for trivial calculations will just result in more time, as most of the time will go in thread context switch, you ideally want to use futures on tasks that usually take time like IO or some heavy processing but for the sake of demo we have chosen simple tasks.
:::

## Let's do some Coding!
### Scala Version
I am using scala version 2.11.12 and you can find the scala doc for futures [here](https://www.scala-lang.org/api/2.11.12/index.html#scala.concurrent.Future)

### Basic Starter Code

``` scala
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits._

object Main {

  def main(args: Array[String]): Unit = {
    val numString = "123"

    val future = Future{ // <-- Future code block 
       println(stringToInt(numString))
    }
  }
  //converts a integer to string
  def stringToInt(numString: String):Int = numString.toInt
}
```

So what we have done here? 

We have defined a function `stringToInt()` that takes a string as input and converts it to integer, we are not concerned with the string not being a valid number for now. 

For now, we want to print the number returned. Now we wrap the call to this `println` function using `Future{..code block..}`.

::: tip Scala 101
In scala every expression returns something and in above case, it returns a `Future[Unit]` as println returns Unit.
:::

So yeah we are done now! This code will print the value 123 in a separate thread! Now lets execute this code.

Wait... the main function exits and you dont see anything printed on the console?

The reason is the future is executed on a separate thread, bt before the separate thread could do anything the main thread exits the main function and the JVM shutsdown!
So lets add this line at the end to see the output to wait till the future finishes and dont forget to import `import scala.concurrent.duration.Duration` 
``` scala
Await.result(future, Duration.Inf)
``` 
And now you will see `123` on console. :tada:

::: tip Tip
You can run all the examples online on [scastie](https://scastie.scala-lang.org/) and you dont have to write inside main, you can directly start coding away! :heart_eyes:
:::

#### Understanding the Code

We skipped over a lot of things before, so lets look at it in a bit more detail.

For using `Future{}` we need to import **`import scala.concurrent.ExecutionContext.Implicits._`** otherwise you will get an error **`"No implicits found for parameter: ExecutionContext"`**.

So implicity you are passing a execution context everytime when you are using `Future{}`, without this it wont compile.

So what is an ExecutionContext? For simplicity let's consider its just a thread pool and Futures require you to pass it everytime. **YES EVERYTIME** and that is why it is convenient to make a it a implicit argument. :)

For our example we are using the pre-existing global execution present in **`scala.concurrent.ExecutionContext.Implicits`**. It utilises the fork join pool present since java 8.

The above example was too simple, let's try to do something a little more practical.

### Future Chaining
The main advantage of future in scala is that you can chain series of functions one after the other. This makes it really powerfull and for achieving this there are several methods we can use.
::: tip Gift
This is what I meant earlier when I said we _use_ the **gift** itself.
:::
#### map and flatMap
Lets look at the below examples for map and flatMap

Suppose you a have source of strings coming from somewhere and each string is alphanumeric, more precisely for our example there is buried a number within characters.
You are tasked with extracting the number and printing. You look at the problem and devise a strategy.

The strategy is:
- Get string
- Replace all english characters
- Trim all the space
- Convert to integer
- Print result

and in that **sequence**.

``` scala
package com.samizzy.scala.basic.map_flatmap

import scala.concurrent.ExecutionContext.Implicits._
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, Future}

object Main {

  //Example for map
  def main(args: Array[String]): Unit = {
    val future = 
                Future(getString).
                  map(sanitize).
                  map(strip).
                  map(stringToInt).
                  map(println)
    
    Await.result(future, Duration.Inf)
  }

  def getString: String = " 123 hey there"

  def sanitize(alphaNumeric: String): String = alphaNumeric.replaceAll("[a-zA-Z]", "")

  def strip(numString: String): String = numString.trim

  def stringToInt(numString: String): Int = numString.toInt

}
```

Each step in the strategy is made into a function and we have chained the functions using `map` method present on Future. _Cool rite?_ :D.

::: tip Benefit
Low level stuff such as waiting for the thread to finish, then pass the result of the this thread to the new thread is taken careof by the futures api
:::

In each `map` method you will get the output of the previous method and you can then perform any operation on them, you are basically being spoon fed the inputs.

It's important to take a look at the signature of **map**, 
``` scala
//T type corresponds to type the current future holds and
//S type corresponds to type that map shall convert to.
def map[S](fn:(T) => S ): Future[S] = {....}
```  

It takes a function that accepts argument of type `T` then transforms it into type `S`, the `map` method itself returns type of `Future[S]`, so basically the passed function has the responsibility of doing transformation and then map will return a Future of that transformation!

Now there maybe a scenario where we are told next that we will get another integer and now we have to add this integer to the extracted integer.

``` scala
    val toAdd: Int = getToAdd
    val future = 
                Future(getString).
                map(sanitize).
                map(strip).
                map(stringToInt).
                map(_ + toAdd).
                map(println)

    Await.result(future, Duration.Inf)
}

  def getToAdd:Int = 20
```

So you say, **"Hold my beer"**. 

You rollup your sleeves and then you smash in the above solution, but then there's a **twist**, you're told the number to add is not constant and can randomly change, and that it is being fetched from an external source, so you always need to fetch the latest value. 

Another thing is some other developer has already written the code for adding a number to the latest number returning Future, so you will receive `Future[Int]` instead of `Int`.

But how do you chain a future from another source? To save us from this hell, `flatMap` comes to the rescue,
``` scala

    val future = 
                Future(getString).
                map(sanitize).
                map(strip).
                map(stringToInt).
                flatMap(getAdded). // getAdded returns Future[Int] and flatMap also returns Future[Int]
                map(println)

    Await.result(future, Duration.Inf)
}

  def getAdded(num: Int):Future[Int] = Future(Random.nextInt(201) + num) //imagine this is from an external source
```

If we take a look at the signature of **flatMap**,
 ``` scala
 //flatMap  takes an function that itself returns Future
 def flatMap[S](fn:(T) => Future[S] ): Future[S]
 ```
it takes a function that accepts an argument of type `T` (similar to map) but this function returns a `Future[S]` as compared to `S` in map.

So flatMap are useful when you have a function that itself returns future and not plain object.

#### zip
But lets say the developer had only implemented the functionality to fetch the number and not add & return, then we can use the zip method. It adds the result of current future (the one on which .zip is called) with another future that is passed as an argument to zip. When I say add result, i mean it delivers the result as a tuple of both results. Below is the code.

``` scala
    val future = 
                Future(getString).
                map(sanitize).
                map(strip).
                map(stringToInt).
                zip(getNum).
                map(tuple=> tuple._1 + tuple._2).
                map(println)
    
    Await.result(future, Duration.Inf)
  }

  def getNum: Future[Int] = Future(Random.nextInt(201))
```

Actually we could have achieved the same thing with **flatMap**, it's not hard to figure out so i'll leave it upto you guys. 

So thats all for now! Thanks for reading! We'll take a look at the rest of the methods some other time. Hope you feel a little more like a future gangsta now :sunglasses:

## Code Samples
All code on this page is available on this [GitHub repository](https://github.com/samizzy/scala-futures-basics)
