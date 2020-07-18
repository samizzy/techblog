---
title: Java 8 Functional Interfaces
author: Samrat Saha
date: 2020-07-18
tags:
 - intermediate
 - java
 - java 8
 - features
categories:
 - technology
---

## Java 8? Isnt it very old now?
Java 8 has become quite old now but it is still the most popular Java version in use now. In this post we will go through some Java 8 features and try to understand them. I find many of them really useful and I thought would be awesome to share them.

<!-- more -->

<img src="/java_beans.jpg"/>

::: warning Note
Originally I had planned to cover many features but the post was getting very long, so I will break it into several smaller posts. This one covers functional
interfaces.
:::

[[toc]]

## Before diving into the features..
There is something called generics in Java and many of the features we will look at use this heavily. What are generics? They allow you to write classes/methods/collections with type safety. 

``` java
public class Main{

    public static void main(String[] args){
        List<String> nameList  = new ArrayList<>();
        //addAll(nameList) <--- This wont compile!
    }

    public static Long addAll(List<Int> numList){
        long sum = 0;
        for(Int num: numList) sum+=num
        return sum;
    }
}
```

In the above simple example, using `addAll()` method with `nameList` wont work as their types dont match. So the compiler throws an error and stops us from doing something stupid.
But remember the information about types is only maintained during compile time and at run time this information is removed, this is called **Type Erasure** in
Java.

::: tip Think
Ever wondered why the compiler throws error when you try to use method overloading with generics?
:::
``` java
public class Main{
  
  //This class wont compile
  public void doSomething(List<String> nameList){
  }

  public void doSomething(List<Integer> numList){
  }
}
```

The compiler complains because at run time, the part with `<Integer>` and `<String>` is removed and then both method signatures look exactly the same as they both have same names and accept a `List` of objects.


## Functional Interfaces

In Java 8, a new package **java.util.function** was introduced, this package contains a total of 43 interfaces i.e 43 functional interfaces. Does this mean all the functional interfaces are defined in this package? No there are also others which have existed before Java 8, we will make a note of them later. Now it doesnt meant you have to remember each interface, even I dont but we shall go through a few core ones as many of the other ones are just special cases of these.

::: tip Definition
An interface which only consists of a _single abstract_ method is called a **Functional Interface.**
:::

Now lets look at some of them. In this section you will only find the description, they will actually used subsequent sections.

### <span>Function Interface</span> 

::: warning Note
Do not get confused between Function and Functional. Function Interface is one of the type of Functional Interfaces in Java.
:::

What is a function? a function is something that takes an input and gives an output. Thats basically the Function Interface. (all other interfaces also have one liner definitions).

Lets look at the interface definition.

``` java
public interface Function<T, R> {
    R apply(T t);
}
```
**Don't let the generics scare you!** The interface signature **`Function<T, R>`** just says that **`T`** is Type of input parameter and **`R`** is the Type of output parameter.

If you look at the **`R apply(T t)`** you will understand this. Also one thing to note is whenever a interface has 2 Type parameters, the first one is usually for input and the latter is for output, this not a rule but the general trend followed, ofcourse you will find many examples where this not followed.

Even though I said we will look at the usages later, lets have a quick look how this can be used so that you will be interested to learn further :P

Lets say you are writing a method.
- That has to encode a string in particular format and return encoded string.
- The strings are actually made from a Java Class.
- The string is basically a representation of that class in 2 formats: Json or Xml

First lets write up part of the code that is not really that relevant to our example.

``` java
public class Main{
    //skipping getter/setters to avoid clutter
    public static class Person{
        public String name;
        public int age;
        public Person(String name, int age){this.name=name;this.age=age;}
    }
    //these class could just contain static methods to convert
    //but thats not the focus here.
    public static class PersonToJson{
        public toJsonString(Person person){
            return "{name:"+ person.name+", age"+ person.age+ "}";
        }
    }
    public static class PersonToXml{
        public toXmlString(Person person){
            return "<Person><name>"+ person.name+"</name><age>"+ person.age+ "</age></Person>";
        }
    }
}
```

So now that we have the POJOs and converters ready, let's write our method.

``` java
    //We have used method overloading here. 
    //Both methods take a converter and a person object. 
    //Apply the converter to person and then return encoded string.
    public String encodeToUTF8(PersonToJson jsConverter, Person person){
        String person = jsConverter.toJsonString(person);
        return new String(person.getBytes(), "UTF-8")
    }

    public String encodeToUTF8(PersonToXml xmlConverter, Person person){
        String person = xmlConverter.toXmlString(person);
        return new String(person.getBytes(), "UTF-8");
    }

```
Above example was without Functional interface, now lets do one with it.

``` java
    public static String encodeToUTF8(Function<Person, String> converter, Person person){
        String person = converter.apply(person);
        return new String(person.getBytes(), "UTF-8");
    }
```
See it has simplified soooooo much!!

How will someone use this method?

Way 1: (Dont worry if you dont understand this, move on to way 2)
``` java
    public static void main(String[] arr){
        Person person = new Person("Immortal",10000);

        Function<Person,String> jsonFunc = new Function<Person,String>(){
            PersonToJson jsonConverter = new PersonToJson();
            @override
            public String apply(Person p){
                return jsonConverter.toJsonString(p);
            }
        };

        Function<Person,String> xmlFunc = new Function<Person,String>(){
            PersonToXml xmlConverter = new PersonToXml();
            @override
            public String apply(Person p){
                return xmlConverter.toXmlString(p);
            }
        };

        String json = encodeToUTF8(jsonFunc, person);
        String xml = encodeToUTF8(xmlFunc, person);
    }
```

Way 2 or as I would like to call it Java 8 way:

``` java
    public static void main(String[] arr){
        Person person = new Person("Immortal",10000);
        PersonToJson jsonConverter = new PersonToJson();
        PersonToXml xmlConverter = new PersonToXml();

        String json = encodeToUTF8(p-> jsonConverter.toJsonString(p), person);
        String xml = encodeToUTF8(p-> xmlConverter.toXmlString(p), person);
    }
```

We have used a Java 8 feature called Lambda, lambdas are basically anonymous methods (we dont need to do **`new Function()`** etc). As you will see Functional
interfaces were made to be used with Lambdas.

Now that we have an idea how they will be used, we will quickly go through the rest of the interfaces.

### Consumer Interface
The Consumer Interface is very simply it only takes a input of Type **`T`** and does something but does not return anything thats why it has return type **`void`**.

What are some existing methods that have this behaviour? Imagine **`System.out.println`** it takes in input object and prints to console.

``` java
public interface Consumer<T> {
    void accept(T t);
}
```
I can write sysout as below,
``` java
Consumer<Object> consumer = o -> System.out.println(o);
``` 
cool right?

### Supplier Interface
The Supplier Interface is the opposite of Consumer Interface, it only returns something of Type **`T`**

This method seems strange, just return something? Remember this is a interface, when we can store state/other objects inside. Remember our Functional interface earlier?
Alrite lets imagine a pure example of this, how about a Random Number Generator?

``` java
public interface Supplier<T> {
    T get();
}
```

### Predicate Interface
The Predicate Interface evaluate a expression and return a boolean. It accepts an input of Type **`T`**. 
``` java
public interface Predicate<T> {
    boolean test(T t);
}
```
If you have been paying attention, you will see that Predicate Interface is a special case of Function Interface which takes Type **`T`** as input and **`boolean`** as output.

So it can be written as,
``` java
public interface Function<T, Boolean>{
    Boolean apply(T t);
}
```

### Other Interfaces
There are other interfaces which are just variations of these above interfaces. There are some with having a prefix **Bi** meaning they take 2 input arguments, they maybe of different Types.

So there is BiConsumer, BiPredicate, BiFunction.
For eg,
``` java
public interface BiConsumer<T, U> {
    //method takes in 2 parameters instead
    //of 1 hence the name Bi
    void accept(T t, U u);
}
```
Why do such interfaces exist, well it is a common use case right! Many times you write methods which accept 2 paramters.

But what happens when you need to write more than 2 parameters? In that case you can convert a BiFunction by partially supplying the one of the values.
``` java
    String c="";
    //This funtion takes 2 inputs String,String
    BiFunction<String,String,Integer> func =
     (a, b) -> Integer.parseInt(a + b + c); 
     // Notice we have supplied c during functional declaration.
     //Also called closure, as we function is closing over the context
     //in this that is variable c.
```
Ofcourse it's not always possible we have any of the 3 values at declaration in that case there are other alternatives, some include defining your own interfaces.

There are other variations such as Predicate which is just a special case of Function as we saw earlier. Other examples are LongConsumer, IntConsumer, DoubleToLongFunction etc etc. You will observe that these type of special variations involve use of primitives instead of Long, Integer, Boolean.

::: tip Why do these special variations exist?
These special variation with primitives available because people want to avoid use of autoboxing (which can use extra memory as compared to primitives) and 
ofcourse because generics dont support primitives.
:::
There are other Functional Interface outside of this package like Runnable Interface. Runnable takes nothing and returns nothing, pretty simple right?

::: tip Remember
What makes a interface a Functional interface if it has only one abstract method.
:::

Anyways that's all for now. I will write about Lambdas, Streams and Method References next as that is needed for more clarity about
actually Functional interfaces.
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