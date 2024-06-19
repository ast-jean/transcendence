FROM docker.elastic.co/logstash/logstash:8.7.1

COPY ./postgresql-42.6.2.jar /usr/share/logstash/logstash-core/jars/postgresql-42.6.2.jar

COPY ./logstash.conf /usr/share/logstash/config/logstash.conf

CMD ["logstash", "-f", "/usr/share/logstash/config/logstash.conf"]