---
title: Scala futures covered
author: Samrat Saha
date: 2020-05-17
tags:
 - beginner
 - intermediate
 - scala
 - futures
categories:
 - technology
---

# Towards the future
What are futures? Is this a concept only limited to select few from scala? Will it affect your future? We are going to find out about all this and more. Keep reading.
<!-- more -->

<img src="/augmented-reality-education-futre.jpg"/>

## So what are futures?
It is a model of parallel programming, there are other models such actor model. It is not limited to scala, there are similar apis in java, javascript and other languages as well.

## Need for futures
What.... parallel programming? People have been parallel programming before right? Java people will say they have java.lang.Thread, why would they bother about futures?
The answer is that Futures are a wrapper over threads, they are a higher level programming api. They provide us many convenient abilities which helps the developer to focus on their programming logic instead of thread creation and their _interaction_. We will see the advantages ahead.

## Let's do some coding yeah?!
### Scala version
I am using scala version 2.11.12 and here is the [scala doc for futures](https://www.scala-lang.org/api/2.11.12/index.html#scala.concurrent.Future)

### Basic Initiliasation code

``` scala
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits._

object Main {

  def main(args: Array[String]): Unit = {
    val numString = "123"
    val future = Future{
       println(stringToInt(numString))
    }
  }

  def stringToInt(numString: String):Int = numString.toInt
}
```
So what we have done here? 
We have defined a function `stringToInt()` that takes a string as input and converts it to integer, we are not concerned with the stirng not being a valid number for now. We want to print the number returned. Now we wrap the call to this function using `Future{..code block..}` and in scala every expression returns and this returns a `Future[Unit]` as println returns Unit.

So yeah we are done now! This code will print the value 123 in a separate thread! Now lets execute this code.

Wait.. the main function exits and you dont see anything printed on the console?

The reason is the future is executed on a separate thread, bt before the separate thread could do anything the main thread exits the main function and the JVM shutsdown!
So lets add this line at the end to see the output to wait till the future finishes and dont forget to import `import scala.concurrent.duration.Duration` 
``` scala
Await.result(future, Duration.Inf)
``` 
::: tip
You can run all the examples online on [scastie](https://scastie.scala-lang.org/) and you dont have to write inside main, you can directly start coding away! :heart_eyes:
:::
And now you will see `123` on console. :tada:

#### Understanding the code

We skipped over a lot of things before, so lets look at it in a bit more detail.

If you try using `Future{}` without importing `import scala.concurrent.ExecutionContext.Implicits._` you will get an error **_"No implicits found for paramerter: ExecutionContext"_**. So implicity you are passing a execution context everytime when you are using `Future{}` without this it wont compile.

So what is an ExecutionContext? For simplicity let's consider its just a thread pool and Futures require you to pass it everytime. **YES EVERYTIME** and that is why it is convenient to make a it a implicit argument. :)

For our example we are using the pre-existing global execution present in `scala.concurrent.ExecutionContext.Implicits`. It utilises the fork join pool present since java 8.

We could have executed any other code inside the Future code block. For simplicity, we have just converted a string to number and printed it. This was all well and good but if this is the only thing future is capable of then NOBODY would be using it. So lets look at some other use cases.

### Future Chaining
The main advantage of future in scala that you can chain series a functions one after the other. This makes it really powerfull and for achieving this there are several methods we can use.

#### map() and flatMap()
Lets look at the below examples for map and flatMap

``` scala
package com.samizzy.scala.basic.map_flatmap

import scala.concurrent.ExecutionContext.Implicits._
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, Future}

object Main {

  def main(args: Array[String]): Unit = {
    val future = Future(getString()).map(sanitize).map(strip).map(stringToInt).map(println(_))
    Await.result(future, Duration.Inf)
  }

  def getString(): String = " 123 hey there"

  def sanitize(alphaNumeric: String): String = alphaNumeric.replaceAll("[a-zA-Z]", "")

  def strip(numString: String): String = numString.trim

  def stringToInt(numString: String): Int = numString.toInt

}
```

Suppose you a have source of strings coming from somewhere and each string is alphanumeric, more precisely for our example there is buried a number within characters.
You are tasked with extracting the number and printing. You look at the problem and devise a strategy.

The strategy is:
- Get the string
- replace all english characters
- trim all the space
- print 

and in that **sequence**.

Each step in the strategy is made into a function and we have chained the functions using map method present on Future. _Cool rite?_ :D. You didnt have to write any code for waiting for the thread to finish, then pass the result of the this thread to the new thread. All this **low level stuff is taken care by the futures api**. In each map method you will get the output of the previous method and you can then perform any operation on them, you are basically being spoon fed the inputs.

I also talked about flatMap rite? Lets first take a look at the signature of map, `def map(fn:(T) => S ): Future[S]` , it takes a function that accepts argument of type `T` then transforms it into type `S`, the map method itself returns type of `Future[S]`, so basically the passed function has the responsibility of doing transformation and then map will return a Future of that transformation!

But lets look at a scenario, we are told we will get another integer and now we have to add this integer to the extracted integer.

``` scala
    val toAdd: Int = getToAdd
    val future = Future(getString()).map(sanitize).map(strip).map(stringToInt).
    map(_ + toAdd).
    map(println(_))

    Await.result(future, Duration.Inf)
}

  def getToAdd:Int = 20
```
So you say, **"No problem!"**. You rollup your sleeve and then you type up the above solution, but then there's a twist, you're told the number to add is not constant and can randomly change, and it is being fetched from a external source, so you always have to fetch the latest value. Some other developer has already written the code for adding a number to the latest number using Future, so now you are getting a `Future[Int]` instead of `Int`.
``` scala

    val future = Future(getString()).map(sanitize).map(strip).map(stringToInt).
    flatMap(getAdded).
    map(println(_))

    Await.result(future, Duration.Inf)
}

  def getAdded(num: Int):Future[Int] = Future(Random.nextInt(201) + num) //imagine this is from an external source
```
So flatMap are useful when you have a function that itself returns future and not plain object.

#### zip()
But lets say the developer had only implemented the functionality to fetch the number and not add and then return, then we can use the zip method adds the result of current future (the one on which .zip is called) with another future that is passed as an argument to zip. When I say add result, i mean it delivers the result as a tuple f both results. Below is the code.

``` scala
    val future = Future(getString()).map(sanitize).map(strip).map(stringToInt).
    zip(getNum()).
    map(tuple=> tuple._1 + tuple._2).
    map(println(_))
    
    Await.result(future, Duration.Inf)
  }

  def getNum(): Future[Int] = Future(Random.nextInt(201))
```

So thats all for now! Thanks for reading! Hope you feel a little more like a future gangsta now :sunglasses:

### Code samples
All code on this page is available on this [GitHub repository](https://github.com/samizzy/scala-futures-basics)